/*

Jon Thrall 
CSC 444, Section 001 

*/


// 
// a08.js
// Template for CSC444 Assignment 08, Fall 2024
// Joshua A. Levine <josh@arizona.edu>
//
// This file provides the template code for A10, providing a skeleton
// for how to initialize and draw tree maps  
//


////////////////////////////////////////////////////////////////////////
// Global variables for the dataset 

// HINT: Start with one of the smaller test datesets included in
// test-cases.js instead of the larger tree in flare.js
// let data = test_1;
// let data = test_2;
let data = flare;



////////////////////////////////////////////////////////////////////////
// Tree related helper functions

function setTreeSize(tree) {
  if (tree.children !== undefined) {
    let size = 0;
    for (let i = 0; i < tree.children.length; ++i) {
      size += setTreeSize(tree.children[i]);
    }
    tree.size = size;
  }
  if (tree.children === undefined) {
    // do nothing, tree.size is already defined for leaves
  }
  return tree.size;
};

function setTreeCount(tree) {
  if (tree.children !== undefined) {
    let count = 0;
    for (let i = 0; i < tree.children.length; ++i) {
      count += setTreeCount(tree.children[i]);
    }
    tree.count = count;
  }
  if (tree.children === undefined) {
    tree.count = 1;
  }
  return tree.count;
}

function setTreeDepth(tree, depth) {
  tree.depth = depth;
  let maxDepth = depth;
  if (tree.children !== undefined) {
    for (let i = 0; i < tree.children.length; ++i) {
      maxDepth = Math.max(maxDepth, setTreeDepth(tree.children[i], depth + 1));
    }
  }
  return maxDepth;
}


// Initialize the size, count, and depth variables within the tree
setTreeSize(data);
setTreeCount(data);
let maxDepth = setTreeDepth(data, 0);



////////////////////////////////////////////////////////////////////////
// Main Code for the Treemapping Technique
function setRectangles(rect, tree, attrFun, isBestCut = false) {
  tree.rect = rect;

  if (tree.children !== undefined) {
    let cumulativeSizes = [0];
    for (let i = 0; i < tree.children.length; ++i) {
      cumulativeSizes.push(cumulativeSizes[i] + attrFun(tree.children[i]));
    }

    let rectWidth = rect.x2 - rect.x1;
    let rectHeight = rect.y2 - rect.y1;
    let border = 3;

    // Splitting direction
    let isHorizontal;
    if (isBestCut) {
      // Best direction logic: use aspect ratio to decide direction
      isHorizontal = rectWidth >= rectHeight;
    } else {
      // Alternate by depth
      isHorizontal = tree.depth % 2 === 0;
    }

    // Define scaling
    let scale = d3.scaleLinear()
                  .domain([0, cumulativeSizes[cumulativeSizes.length - 1]]);
    if (isHorizontal) {
      scale.range([rect.x1, rect.x2]);
    } else {
      scale.range([rect.y1, rect.y2]);
    }

    // Assign rectangles to children
    for (let i = 0; i < tree.children.length; ++i) {
      let start = cumulativeSizes[i];
      let end = cumulativeSizes[i + 1];

      if (isHorizontal) {
        let x1 = scale(start) + border;
        let x2 = scale(end) - border;
        let y1 = rect.y1 + border;
        let y2 = rect.y2 - border;

        setRectangles({ x1, x2, y1, y2 }, tree.children[i], attrFun, isBestCut);
      } else {
        let x1 = rect.x1 + border;
        let x2 = rect.x2 - border;
        let y1 = scale(start) + border;
        let y2 = scale(end) - border;

        setRectangles({ x1, x2, y1, y2 }, tree.children[i], attrFun, isBestCut);
      }
    }
  }
}

// initialize the tree map
let winWidth = window.innerWidth;
let winHeight = window.innerHeight;

// compute the rectangles for each tree node
setRectangles(
  { x1: 0, y1: 0, x2: winWidth, y2: winHeight }, data,
  function (t) { return t.size; }
);

// make a list of all tree nodes;
function makeTreeNodeList(tree, lst) {
  lst.push(tree);
  if (tree.children !== undefined) {
    for (let i = 0; i < tree.children.length; ++i) {
      makeTreeNodeList(tree.children[i], lst);
    }
  }
}

let treeNodeList = [];
makeTreeNodeList(data, treeNodeList);



////////////////////////////////////////////////////////////////////////
// Visual Encoding portion

// d3 selection to draw the tree map 
const colorScale = d3.scaleOrdinal()
  .domain(d3.range(maxDepth + 1))
  .range(["#BEB7A4", "#D8A47F", "#A26769", "#582C4D", "#F05D5E", "#FF1B1C", "#FF7F11"]);

let gs = d3.select("#svg")
  .attr("width", winWidth)
  .attr("height", winHeight)
  .selectAll("g")
  .data(treeNodeList)
  .enter()
  .append("g");

function setAttrs(sel) {
  sel.attr("x", treeNode => treeNode.rect.x1)
    .attr("y", treeNode => treeNode.rect.y1)
    .attr("width", treeNode => treeNode.rect.x2 - treeNode.rect.x1)
    .attr("height", treeNode => treeNode.rect.y2 - treeNode.rect.y1)
    .attr("fill", treeNode => colorScale(treeNode.depth))
    .attr("stroke", "white")
    .attr("stroke-width", 1);
}

gs.append("rect").call(setAttrs);



////////////////////////////////////////////////////////////////////////
// Callbacks for buttons
d3.select("#size").on("click", function () {
  setRectangles(
    { x1: 0, x2: winWidth, y1: 0, y2: winHeight },
    data,
    function (t) { return t.size; } 
  );
  d3.selectAll("rect").transition().duration(1000).call(setAttrs);
});

d3.select("#count").on("click", function () {
  setRectangles(
    { x1: 0, x2: winWidth, y1: 0, y2: winHeight },
    data,
    function (t) { return t.count; } 
  );
  d3.selectAll("rect").transition().duration(1000).call(setAttrs);
});

d3.select("#best-size").on("click", function () {
  setRectangles(
    { x1: 0, x2: winWidth, y1: 0, y2: winHeight },
    data,
    function (t) { return t.size; }, 
    true 
  );
  d3.selectAll("rect").transition().duration(1000).call(setAttrs);
});

d3.select("#best-count").on("click", function () {
  setRectangles(
    { x1: 0, x2: winWidth, y1: 0, y2: winHeight },
    data,
    function (t) { return t.count; },
    true
  );
  d3.selectAll("rect").transition().duration(1000).call(setAttrs);
});
