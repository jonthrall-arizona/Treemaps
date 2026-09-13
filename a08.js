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

// Sequential blue scale by depth - lighter near the root, darker as the
// hierarchy goes deeper. Ties this chart's palette to the heatmap in the
// D3 Introduction project rather than the arbitrary warm palette this used
// to have.
const colorScale = d3.scaleSequential(d3.interpolateBlues)
  .domain([0, maxDepth + 1]);

// Rough heuristic for label/legend text contrast: the Blues scale gets
// dark enough by depth 2 that white text reads better than dark ink.
function textColorFor(depth) {
  return depth <= 1 ? "#1b1e23" : "#ffffff";
}

// Only label leaf nodes (individual files) - labeling every directory
// level too would be very noisy given how nested this tree is - and only
// when the box is large enough for the text to actually be legible.
function labelVisible(treeNode) {
  if (treeNode.children !== undefined) return false;
  const rw = treeNode.rect.x2 - treeNode.rect.x1;
  const rh = treeNode.rect.y2 - treeNode.rect.y1;
  return rw > 50 && rh > 18;
}

let gs = d3.select("#svg")
  .attr("width", winWidth)
  .attr("height", winHeight)
  .selectAll("g")
  .data(treeNodeList)
  .enter()
  .append("g");

const rects = gs.append("rect");

// Native <title> tooltip - shows the metrics regardless of which button is
// currently active, since both are always computed up front.
rects.append("title")
  .text(treeNode => `${treeNode.name}\nSize: ${treeNode.size}\nCount: ${treeNode.count}`);

const labels = gs.append("text")
  .attr("class", "node-label")
  .text(treeNode => treeNode.children === undefined ? treeNode.name : "");

function setRectAttrs(sel) {
  sel.attr("x", treeNode => treeNode.rect.x1)
    .attr("y", treeNode => treeNode.rect.y1)
    .attr("width", treeNode => treeNode.rect.x2 - treeNode.rect.x1)
    .attr("height", treeNode => treeNode.rect.y2 - treeNode.rect.y1)
    .attr("fill", treeNode => colorScale(treeNode.depth))
    .attr("stroke", "white")
    .attr("stroke-width", 1);
}

function setLabelAttrs(sel) {
  sel.attr("x", treeNode => (treeNode.rect.x1 + treeNode.rect.x2) / 2)
    .attr("y", treeNode => (treeNode.rect.y1 + treeNode.rect.y2) / 2)
    .attr("fill", treeNode => textColorFor(treeNode.depth))
    .style("opacity", treeNode => labelVisible(treeNode) ? 1 : 0);
}

setRectAttrs(rects);
setLabelAttrs(labels);

// Build the depth legend now that maxDepth and colorScale are known.
const legendSwatches = d3.select("#legend-swatches");
for (let depth = 0; depth <= maxDepth; depth++) {
  const row = legendSwatches.append("div").attr("class", "legend-row");
  row.append("div")
    .attr("class", "legend-swatch")
    .style("background", colorScale(depth));
  row.append("span").text(`Depth ${depth}`);
}



////////////////////////////////////////////////////////////////////////
// Callbacks for buttons

// Track the current view so a window resize can redraw using whichever
// mode the user last selected, instead of always snapping back to "Size".
let currentMetricFn = treeNode => treeNode.size;
let currentIsBestCut = false;

function setActiveButton(id) {
  d3.selectAll(".buttons button").classed("is-active", false);
  d3.select("#" + id).classed("is-active", true);
}

function redraw(animate) {
  setRectangles(
    { x1: 0, x2: winWidth, y1: 0, y2: winHeight },
    data,
    currentMetricFn,
    currentIsBestCut
  );

  if (animate) {
    d3.selectAll("#svg rect").transition().duration(1000).call(setRectAttrs);
    d3.selectAll(".node-label").transition().duration(1000).call(setLabelAttrs);
  } else {
    setRectAttrs(d3.selectAll("#svg rect"));
    setLabelAttrs(d3.selectAll(".node-label"));
  }
}

d3.select("#size").on("click", function () {
  currentMetricFn = treeNode => treeNode.size;
  currentIsBestCut = false;
  setActiveButton("size");
  redraw(true);
});

d3.select("#count").on("click", function () {
  currentMetricFn = treeNode => treeNode.count;
  currentIsBestCut = false;
  setActiveButton("count");
  redraw(true);
});

d3.select("#best-size").on("click", function () {
  currentMetricFn = treeNode => treeNode.size;
  currentIsBestCut = true;
  setActiveButton("best-size");
  redraw(true);
});

d3.select("#best-count").on("click", function () {
  currentMetricFn = treeNode => treeNode.count;
  currentIsBestCut = true;
  setActiveButton("best-count");
  redraw(true);
});

// Redraw (without animation) on window resize so the treemap always fills
// the viewport, rather than staying locked to its size at page load.
let resizeTimer;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function () {
    winWidth = window.innerWidth;
    winHeight = window.innerHeight;
    d3.select("#svg").attr("width", winWidth).attr("height", winHeight);
    redraw(false);
  }, 150);
});
