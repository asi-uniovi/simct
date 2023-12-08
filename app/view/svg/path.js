'use strict'

import { gr } from '../gridmanager.js'

import { SVGBase } from './svgbase.js'
import { SVGGroup } from './group.js'
import { SVGArrow } from './arrow.js'
import { SVGText } from './text.js'

import { anchors } from '../ctelements/anchor.js'

class SVGPath extends SVGBase {
  /**
     *
     * @param {*} container
     * @param {*} id
     * @param {*} x
     * @param {*} y
     * @param {*} direction 2 characters first horizontal: (L)eft (R)ight, second vertical (U)p (D)own
     */
  constructor (container, id, x, y, direction) {
    super('polyline', '', id)

    this.direction = direction
    this.pointArray = []

    this.points = ''

    this.group = new SVGGroup('path', this.id)

    this.group.addClass('segment-inactive')

    // TODO: Validate direction format

    this.lineText = new SVGText(x - 3, y - 1, '', gr.gridSize)

    this.lineText.addClass('wire-text').addClass('wire-text-inactive')

    // this.arrowStart = new SVGPolygon('0 0 4 4 0 8 0 0', 'arrow-bullet-inactive', 'arrow-start');
    this.arrowStart = new SVGArrow('arrow-start')
    this.arrowEnd = new SVGArrow('arrow-end')

    this.addPoint(x, y)

    container.appendChild(this.group.svg)
    this.group.append(this)

    if (this.direction['0'] !== 'N') this.group.append(this.arrowStart)
    if (this.direction['1'] !== 'N') this.group.append(this.arrowEnd)

    this.group.append(this.lineText)

    this.redrawArrows()
  }

  redrawArrows () {
    // TODO: See if the arrow is well positioned or we have to use the stroke
    // let stroke = parseInt(getComputedStyle(this.svg).strokeWidth);
    this.arrowStart.translate(this.pointArray[0][0], this.pointArray[0][1]).orientate(this.direction[0])

    const npoints = this.pointArray.length

    if (npoints > 0) {
      this.arrowEnd.translate(this.pointArray[npoints - 1][0], this.pointArray[npoints - 1][1]).orientate(this.direction[1])
    }
  }

  setLabel (label, i = 0, HV = 'MM', oh = 0, ov = 0) {
    this.lineText.text = label
    const point = this.pointArray[i]

    switch (HV[0]) {
      case 'L': this.lineText.x = point[0] - this.lineText.svg.getBBox().width - 6 - oh
        break
      case 'R': this.lineText.x = point[0] + 4 + oh
        break
      case 'M': this.lineText.x = point[0] - this.lineText.svg.getBBox().width * 0.5 - 4 - oh
        break
    }

    switch (HV[1]) {
      case 'D': this.lineText.y = point[1] + this.lineText.svg.getBBox().height - 2 - ov
        break
      case 'U': this.lineText.y = point[1] - 2 - ov
        break
      case 'M': this.lineText.y = point[1] + this.lineText.svg.getBBox().height * 0.25 + ov
        break
    }

    return this
  }

  setType (type = 'bus-inactive') {
    // this.svg.style.strokeWidth = 4;

    switch (type) {
      case 'bus': this.svg.style.stroke = 'var(--bus-inactive-color)'
        break
      case 'bus-active': this.svg.style.stroke = 'var(--bus-active-color)'
        break
    }

    // this.svg.style.stroke = 'var(--bus-active-color)';
    this.arrowStart.removeClass('arrow-bullet-inactive').addClass('arrow-bus-bullet-inactive')
    this.arrowEnd.removeClass('arrow-bullet-inactive').addClass('arrow-bus-bullet-inactive')
    return this
  }

  addAnchor (anchorlabel) {
    return this.addPoint(...anchors.getAnchor(anchorlabel))
  }

  addPoint (x, y, name = '') {
    this.pointArray.push([x, y])
    this.pointsArr = this.pointArray

    this.redrawArrows()

    return this
  }

  gopx () {

  }

  gogrid () {

  }

  goRight (v, name = '') {
    const npoints = this.pointArray.length
    const lastpoint = this.pointArray[npoints - 1]
    this.addPoint(lastpoint[0] + v, lastpoint[1], name)
    return this
  }

  goLeft (v, name = '') {
    const npoints = this.pointArray.length
    const lastpoint = this.pointArray[npoints - 1]
    this.addPoint(lastpoint[0] - v, lastpoint[1], name)
    return this
  }

  goUp (v, name = '') {
    const npoints = this.pointArray.length
    const lastpoint = this.pointArray[npoints - 1]
    this.addPoint(lastpoint[0], lastpoint[1] - v, name)
    return this
  }

  goDown (v, name = '') {
    const npoints = this.pointArray.length
    const lastpoint = this.pointArray[npoints - 1]
    this.addPoint(lastpoint[0], lastpoint[1] + v, name)
    return this
  }

  set points (pointsstr) {
    this.svg.setAttribute('points', pointsstr)
  }

  get points () {
    this.svg.getAttribute('points')
  }

  get pointsArr () {
    return this.svg.getAttribute('points').match(/[0-9]+[ ]+[0-9]+/gm).map(point => point.replace(/  +/g, ' ').split(' ').map(Number))
  }

  set pointsArr (pointArray) {
    this.points = pointArray.map(point => point.join(',')).join(' ')
  }

  updateValue (value) {
    this.registerValue.text = value
  }

  listen (message) {
    switch (message.topic) {
      case this.id + 'updatedValue': {
        this.updateValue(message.value)
      }
    }
  }

  Activate () {
    this.group.svg.parentNode.append(this.group.svg)
    this.group.removeClass('segment-inactive').addClass('segment-active')
    return this
  }

  DeActivate () {
    this.group.removeClass('segment-active').addClass('segment-inactive')
    return this
  }
}

export { SVGPath }
