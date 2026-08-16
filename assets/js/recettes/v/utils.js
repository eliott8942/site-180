// original code: https://mgechev.github.io/javascript-algorithms/graphs_others_topological-sort.js.html
function topologicalSort(graph, vertices) {
  function topologicalSortHelper(node, visited, temp, graph, result) {
    temp[node] = true;
    var neighbors = vertices(graph[node]);
    for (var i = 0; i < neighbors.length; i += 1) {
      var n = neighbors[i];
      if (temp[n]) {
        throw new Error('The graph is not a DAG');
      }
      if (!visited[n]) {
        topologicalSortHelper(n, visited, temp, graph, result);
      }
    }
    temp[node] = false;
    visited[node] = true;
    result.push(node);
  }
  /**
    * Topological sort algorithm of a directed acyclic graph.<br><br>
    * Time complexity: O(|E| + |V|) where E is a number of edges
    * and |V| is the number of nodes.
    *
    * @public
    * @module graphs/others/topological-sort
    * @param {Array} graph Adjacency list, which represents the graph.
    * @returns {Array} Ordered vertices.
    *
    * @example
    * var topsort =
    *  require('path-to-algorithms/src/graphs/' +
    * 'others/topological-sort').topologicalSort;
    * var graph = {
    *     v1: ['v2', 'v5'],
    *     v2: [],
    *     v3: ['v1', 'v2', 'v4', 'v5'],
    *     v4: [],
    *     v5: []
    * };
    * var vertices = topsort(graph); // ['v3', 'v4', 'v1', 'v5', 'v2']
    */
  var result = [];
  var visited = [];
  var temp = [];
  for (var node in graph) {
    if (!visited[node] && !temp[node]) {
      topologicalSortHelper(node, visited, temp, graph, result);
    }
  }
  return result.reverse();
};

function arrayDiff(arr1, arr2) {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  
  return [
    ...arr1.filter(x => !set2.has(x)),
    ...arr2.filter(x => !set1.has(x))
  ];
}

function isSubsetOf(subset, superset) {
  for (const item of subset) {
    if (!superset.has(item)) return false
  }
  return true
}

// Source - https://stackoverflow.com/a/17445322
// Posted by Yannis, modified by community. See post 'Timeline' for change history
// Retrieved 2026-08-16, License - CC BY-SA 3.0
function gcd(a,b) {
  a = Math.abs(a);
  b = Math.abs(b);
  if (b > a) {var temp = a; a = b; b = temp;}
  while (true) {
    if (b == 0) return a;
    a %= b;
    if (a == 0) return b;
    b %= a;
  }
}
