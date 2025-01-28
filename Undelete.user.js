// ==UserScript==
// @name         Undelete
// @namespace    Pyr
// @version      0.1.1
// @description  Adds 50 steps to bring back removed segments
// @author       Krzysztof Kruk
// @match        https://play.pyr.ai/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pyr.ai
// @updateURL    https://raw.githubusercontent.com/ChrisRaven/Pyr-Undelete/main/Undelete.user.js
// @downloadURL  https://raw.githubusercontent.com/ChrisRaven/Pyr-Undelete/main/Undelete.user.js
// @grant        none
// ==/UserScript==

/* global viewer */

(function() {
  'use strict';

  const MAX_LENGTH = 50

  const undeleteButton = document.createElement('button')
  undeleteButton.id = 'undelete'

  function getLS() {
    const deleted = localStorage.getItem('deleted')
    return deleted && deleted.length ? JSON.parse(deleted) : []
  }

function setLS(deleted) {
  if (!deleted) return
  localStorage.setItem('deleted', JSON.stringify(deleted))
}

const checkForViewer = setInterval(() => {
  if (typeof viewer === 'undefined') return

  clearInterval(checkForViewer)
  document.getElementsByClassName('neuroglancer-annotation-tool-status')[0].after(undeleteButton)

  viewer.selectedLayer.layer_.layer_.displayState.segmentationGroupState.value.selectedSegments.changed.add((segId, added) => {
    if (added) return
    if (Array.isArray(segId)) return
    const deleted = getLS()
    if (deleted.length >= MAX_LENGTH) {
      deleted.shift()
    }
    deleted.push(segId)
    setLS(deleted)
    updateCounter(deleted)
  })

  document.getElementById('undelete').addEventListener('click', e => {
    const deleted = getLS()
    if (!deleted.length) return

    const segIdString = deleted.pop()
    // clone an already (always?) existing object to be able to pass it to the add() methods
    // and to have acccess to the .parseString() method
    const emptySegId = viewer.selectedLayer.layer_.layer_.displayState.segmentSelectionState.selectedSegment.clone()
    const segId = emptySegId.parseString(segIdString)
    viewer.selectedLayer.layer_.layer_.displayState.segmentationGroupState.value.selectedSegments.add(segId)
    viewer.selectedLayer.layer_.layer_.displayState.segmentationGroupState.value.visibleSegments.add(segId)
    setLS(deleted)
    updateCounter(deleted)
  })

  updateCounter(getLS())
}, 100)


function updateCounter(arr) {
  undeleteButton.textContent = `Undelete (${arr.length})`
  undeleteButton.disabled = !arr.length
}


})()