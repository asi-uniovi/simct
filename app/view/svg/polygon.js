'use strict'

import { SVGBase } from './svgbase.js'

class SVGPolygon extends SVGBase {
  constructor (pointsstr, _class = '', id = '') {
    super('polygon', _class, id)
    this.points = pointsstr
  }

  /**
     * Expects x,y point in px
     * @param {*} x
     * @param {*} y
     * @returns
     */
  addPoint (x, y) {
    const pointArray = this.pointsArr
    pointArray.push([x, y])
    this.pointsArr = pointArray
    return this
  }

  /**
     * Expects x increment and y increment in the unit provided by the property currentUnit in the base class SVGElement
     * @param {*} x
     * @param {*} y
     * @returns
     */
  go (x, y) {
    const npoints = this.pointsArr.length
    const lastpoint = this.pointsArr[npoints - 1]
    if (lastpoint) this.addPoint(lastpoint[0] + this.UnitValue(x), lastpoint[1] + this.UnitValue(y))
    else this.addPoint(this.UnitValue(x), this.UnitValue(y))
    return this
  }

  goRight (v) {
    return this.go(v, 0)
  }

  goLeft (v) {
    return this.go(-v, 0)
  }

  goUp (v) {
    return this.go(0, -v)
  }

  goDown (v) {
    return this.go(0, v)
  }

  set points (pointsstr) {
    this.svg.setAttribute('points', pointsstr)
  }

  get points () {
    return this.svg.getAttribute('points')
  }

  get pointsArr () {
    return this.points.trim() !== '' ? this.points.match(/[-0-9.]+[ ]+[-0-9.]+/gm).map(point => point.replace(/  +/g, ' ').split(' ').map(Number)) : []
  }

  set pointsArr (pointArray) {
    this.points = pointArray.map(point => point.join(' ')).join(' ')
  }
}

export { SVGPolygon }
