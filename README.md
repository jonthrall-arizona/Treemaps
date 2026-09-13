Treemaps
------------

**[Live demo →]([https://jonthrall-arizona.github.io/Linked-Views/)**

Author: Jon Thrall (Jonthrall21@gmail.com)

## Notes

This project draws a full-viewport, interactive treemap of the [Flare](https://github.com/prefuse/Flare)
codebase using a custom-built (not D3's built-in `d3.treemap`) slice-and-dice partitioning algorithm.
Box color encodes nesting depth, leaf boxes are labeled with the file name when there's room, and every
box shows its size and count on hover. The four buttons switch what determines box size (file size vs.
file count) and how space is divided at each level (alternate by depth vs. best aspect ratio).

## Environment

* Operating System: Mac
* Browser: Chrome

## Included Files

* README.md -- this file
* index.html
* style.css
* a08.js
* flare.js
* test-cases.js

D3 is loaded from the [d3js.org CDN](https://d3js.org/d3.v7.min.js) rather than vendored locally.

## How to Run

Open `index.html` in a modern browser (or serve the folder with any static file server). An internet
connection is needed to load D3 from the CDN. Datasets can be changed by commenting/uncommenting the
different options at the top of `a08.js`.

## References

No external resources were used in this project. Aside from the provided files, all SVG, CSS, and JS
elements were designed and implemented from scratch.
