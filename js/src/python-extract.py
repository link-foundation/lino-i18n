"""Bounded Python AST extraction. Application code is parsed, never imported."""
import ast
import json
import re
import sys

try:
    import resource
    resource.setrlimit(resource.RLIMIT_AS, (512 * 1024 * 1024, 512 * 1024 * 1024))
    resource.setrlimit(resource.RLIMIT_STACK, (8 * 1024 * 1024, 8 * 1024 * 1024))
except (ImportError, ValueError, OSError):
    pass  # Windows lacks resource; byte/node/depth/variant and parent time bounds remain.

if sys.version_info < (3, 11):
    sys.exit('Python 3.11 or newer is required')

sys.stdin.reconfigure(encoding='utf-8')

PACKAGES = ('gt_flask', 'gt_fastapi', 'lino_i18n')
APIS = ('t', 'gt', 'm', 'msg', 'derive')


def library(name):
    return any(name == package or name.startswith(package + '.') for package in PACKAGES)


def escape(text):
    return re.sub(r'[{}<]', lambda match: "'" + match[0] + "'", text.replace("'", "''"))


class Scope:
    def __init__(self, body, parent=None, arguments=None, kind='function'):
        self.parent, self.kind = parent, kind
        self.bindings, self.global_names, self.nonlocal_names = {}, set(), set()
        for node in body:
            self.collect(node)
        if arguments:
            for arg in [*arguments.posonlyargs, *arguments.args, *arguments.kwonlyargs]:
                self.bind(arg.arg, None)
            for arg in (arguments.vararg, arguments.kwarg):
                if arg:
                    self.bind(arg.arg, None)

    def bind(self, name, value):
        # Multiple writes cannot safely identify a source API or static declaration.
        self.bindings[name] = value if name not in self.bindings else None

    def collect(self, node):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            self.bind(node.name, ('function', node) if not isinstance(node, ast.ClassDef) else None)
            return
        if isinstance(node, (ast.Lambda, ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp)):
            return
        if isinstance(node, ast.ImportFrom):
            for alias in node.names:
                api = alias.name if library(node.module or '') and alias.name in APIS else None
                self.bind(alias.asname or alias.name, ('api', api) if api else None)
            return
        if isinstance(node, ast.Import):
            for alias in node.names:
                self.bind(alias.asname or alias.name.split('.')[0], ('namespace', None) if library(alias.name) else None)
            return
        if isinstance(node, ast.Global):
            self.global_names.update(node.names)
            return
        if isinstance(node, ast.Nonlocal):
            self.nonlocal_names.update(node.names)
            return
        if isinstance(node, (ast.Assign, ast.AnnAssign)):
            targets = node.targets if isinstance(node, ast.Assign) else [node.target]
            for target in targets:
                if isinstance(target, ast.Name):
                    self.bind(target.id, ('value', node.value))
                else:
                    self.collect(target)
            return
        if isinstance(node, ast.Name) and isinstance(node.ctx, (ast.Store, ast.Del)):
            self.bind(node.id, None)
        if isinstance(node, (ast.ExceptHandler, ast.MatchAs, ast.MatchStar)) and node.name:
            self.bind(node.name, None)
        if isinstance(node, ast.MatchMapping) and node.rest:
            self.bind(node.rest, None)
        for child in ast.iter_child_nodes(node):
            self.collect(child)

    def root(self):
        scope = self
        while scope.parent:
            scope = scope.parent
        return scope

    def resolve(self, name):
        if self.parent and name in self.global_names:
            return self.root().resolve(name)
        if name in self.nonlocal_names:
            return self.parent.resolve(name) if self.parent else (None, self)
        if name in self.bindings:
            return self.bindings[name], self
        return self.parent.resolve(name) if self.parent else (None, self)

    def api(self, node):
        if isinstance(node, ast.Name):
            binding, _ = self.resolve(node.id)
            return binding[1] if binding and binding[0] == 'api' else None
        if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name):
            binding, _ = self.resolve(node.value.id)
            if binding and binding[0] == 'namespace' and node.attr in APIS:
                return node.attr
        return None


class Extractor(ast.NodeVisitor):
    def __init__(self, tree, source, file, max_variants):
        self.scope = Scope(tree.body, kind='module')
        self.lines, self.file, self.max_variants = source.splitlines(), file, max_variants
        self.messages, self.diagnostics = [], []

    def error(self, node, message):
        self.diagnostics.append({'file': self.file, 'line': getattr(node, 'lineno', 1), 'message': message})

    def choices(self, items):
        output = list(dict.fromkeys(items))
        if len(output) > self.max_variants:
            raise ValueError(f'Derivation exceeds {self.max_variants} variants')
        return output

    def combine(self, left, right):
        if len(left) * len(right) > self.max_variants:
            raise ValueError(f'Derivation exceeds {self.max_variants} variants')
        return self.choices(a + b for a in left for b in right)

    def values(self, node, scope, seen=(), depth=0):
        if depth > 20 or node is None or id(node) in seen:
            raise ValueError('Static derivation cycle or depth limit (20)')
        seen = (*seen, id(node))
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            return [node.value]
        if isinstance(node, ast.IfExp):
            return self.choices(self.values(node.body, scope, seen, depth + 1) + self.values(node.orelse, scope, seen, depth + 1))
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
            return self.combine(self.values(node.left, scope, seen, depth + 1), self.values(node.right, scope, seen, depth + 1))
        if isinstance(node, ast.Name):
            binding, owner = scope.resolve(node.id)
            if binding and binding[0] == 'value':
                return self.values(binding[1], owner, seen, depth + 1)
        if isinstance(node, ast.Subscript):
            container = node.value
            owner = scope
            if isinstance(container, ast.Name):
                binding, owner = scope.resolve(container.id)
                container = binding[1] if binding and binding[0] == 'value' else None
            if isinstance(container, ast.Dict):
                if isinstance(node.slice, ast.Constant):
                    for key, value in zip(container.keys, container.values):
                        if isinstance(key, ast.Constant) and key.value == node.slice.value:
                            return self.values(value, owner, seen, depth + 1)
                    raise ValueError('Static dictionary key is missing')
                return self.choices(value for item in container.values for value in self.values(item, owner, seen, depth + 1))
            if isinstance(container, (ast.List, ast.Tuple)):
                if isinstance(node.slice, ast.Constant) and isinstance(node.slice.value, int):
                    try:
                        return self.values(container.elts[node.slice.value], owner, seen, depth + 1)
                    except IndexError as error:
                        raise ValueError('Static sequence index is missing') from error
                return self.choices(value for item in container.elts for value in self.values(item, owner, seen, depth + 1))
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            binding, owner = scope.resolve(node.func.id)
            if binding and binding[0] == 'function':
                function = binding[1]
                # Parameter-dependent returns are not guessed or executed.
                child = Scope(function.body, owner, function.args)
                return_nodes = []
                pending = list(function.body)
                while pending:
                    item = pending.pop(0)
                    if isinstance(item, ast.Return):
                        return_nodes.append(item)
                    elif not isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Lambda)):
                        pending.extend(ast.iter_child_nodes(item))
                if return_nodes:
                    return self.choices(value for item in sorted(return_nodes, key=lambda item: item.lineno)
                                        for value in self.values(item.value, child, seen, depth + 1))
        raise ValueError('Unsupported dynamic source; use bounded derive() with literal returns')

    def source(self, node):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            return [node.value]
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
            return self.combine(self.source(node.left), self.source(node.right))
        if isinstance(node, ast.Call) and self.scope.api(node.func) == 'derive' and len(node.args) == 1:
            return [escape(value) for value in self.values(node.args[0], self.scope)]
        if isinstance(node, ast.JoinedStr):
            output = ['']
            for item in node.values:
                if isinstance(item, ast.Constant):
                    values = [escape(item.value)]
                elif isinstance(item, ast.FormattedValue) and item.conversion == -1 and item.format_spec is None:
                    if not isinstance(item.value, ast.Call) or self.scope.api(item.value.func) != 'derive':
                        raise ValueError('Dynamic f-string interpolation requires derive(); use plain ICU placeholders for runtime values')
                    values = self.source(item.value)
                else:
                    raise ValueError('F-string conversions and format specs are not static sources')
                output = self.combine(output, values)
            return output
        raise ValueError('Unsupported dynamic source; use a string literal or derive()')

    def visit_Call(self, node):
        if self.scope.api(node.func) in ('t', 'gt', 'm', 'msg'):
            try:
                if not node.args or isinstance(node.args[0], ast.Starred):
                    raise ValueError('Translation requires a positional source string')
                sources = self.source(node.args[0])
                metadata = {}
                for keyword in node.keywords:
                    if keyword.arg in ('_id', '_context'):
                        if not isinstance(keyword.value, ast.Constant) or not isinstance(keyword.value.value, str):
                            raise ValueError('Message id and description must be static strings')
                        metadata['id' if keyword.arg == '_id' else 'description'] = keyword.value.value
                if metadata.get('id') == '':
                    raise ValueError('Message id must be non-empty')
                if len(sources) > 1 and 'id' in metadata:
                    raise ValueError('Derived variants cannot share one explicit id')
                line = self.lines[node.lineno - 1]
                column = len(line.encode('utf8')[:node.col_offset].decode('utf8')) + 1
                for source in sources:
                    self.messages.append({'id': metadata.get('id') or source, 'source': source, **metadata,
                                          'file': self.file, 'line': node.lineno, 'column': column})
            except (ValueError, RecursionError) as error:
                self.error(node, str(error))
        self.generic_visit(node)

    def visit_scope(self, node, body, kind, arguments=None):
        previous = self.scope
        parent = previous
        if kind == 'function':
            while parent.kind == 'class' and parent.parent:
                parent = parent.parent
        self.scope = Scope(body, parent, arguments, kind)
        for item in body:
            self.visit(item)
        self.scope = previous

    def visit_FunctionDef(self, node):
        for item in [*node.decorator_list, *node.args.defaults, *filter(None, node.args.kw_defaults)]:
            self.visit(item)
        self.visit_scope(node, node.body, 'function', node.args)

    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_ClassDef(self, node):
        for item in [*node.decorator_list, *node.bases, *node.keywords]:
            self.visit(item)
        self.visit_scope(node, node.body, 'class')

    def visit_Lambda(self, node):
        self.visit_scope(node, [node.body], 'function', node.args)

    def visit_comprehension_scope(self, node):
        self.visit(node.generators[0].iter)
        previous = self.scope
        self.scope = Scope([generator.target for generator in node.generators], previous)
        for index, generator in enumerate(node.generators):
            if index:
                self.visit(generator.iter)
            for condition in generator.ifs:
                self.visit(condition)
        for item in ([node.key, node.value] if isinstance(node, ast.DictComp) else [node.elt]):
            self.visit(item)
        self.scope = previous

    visit_ListComp = visit_comprehension_scope
    visit_SetComp = visit_comprehension_scope
    visit_DictComp = visit_comprehension_scope
    visit_GeneratorExp = visit_comprehension_scope


def extract(request):
    source, file = request['source'], request['file']
    result = {'version': 1, 'messages': [], 'diagnostics': []}
    try:
        tree = ast.parse(source, filename=file)
        pending, count = [(tree, 0)], 0
        while pending:
            node, depth = pending.pop()
            count += 1
            if count > 10000 or depth > 100:
                raise ValueError('Python AST exceeds 10000 nodes or depth 100')
            pending.extend((child, depth + 1) for child in ast.iter_child_nodes(node))
        extractor = Extractor(tree, source, file, request['maxVariants'])
        extractor.visit(tree)
        result.update(messages=extractor.messages, diagnostics=extractor.diagnostics)
    except SyntaxError as error:
        result['diagnostics'].append({'file': file, 'line': error.lineno or 1, 'message': 'Python syntax: ' + error.msg})
    except (ValueError, RecursionError, MemoryError) as error:
        result['diagnostics'].append({'file': file, 'line': 1, 'message': str(error) or 'Python extraction memory limit'})
    return result


if __name__ == '__main__':
    print(json.dumps(extract(json.load(sys.stdin)), ensure_ascii=True))
