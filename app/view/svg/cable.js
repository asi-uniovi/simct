'use strict'

import { gr } from '../gridmanager.js'
import { SVGText } from './text.js'
import { SVGGroup } from './group.js'
import { SVGArrow } from './arrow.js'
import { SVGBase } from './svgbase.js'
import { anchors } from '../ctelements/anchor.js'
import { Uc } from '../../control/uc.js'

const _cables = []

class SVGCable extends SVGBase {
  static get cables () { return _cables }

  static reset () { _cables.forEach(item => item.DeActivate()) }

  static getCable (label) { return _cables.filter(item => item.id === label)[0] }

  /**
   * Creates a new cable SVG element and adds it to the cables array.
   *
   * @param {SVGContainer} container - The SVG container to add the cable to.
   * @param {string} [id=''] - Optional ID for the cable.
   * @param {string} type - The type of cable (e.g. 'signal', 'int').
   * @param {string[]} [activators] - Activator topics that will activate the cable.
   * @returns {SVGCable} The newly created cable instance.
   */
  static new (container, id = '', cabletype, activators = null) {
    _cables.push(new this(container, id, cabletype, activators))
    return _cables[_cables.length - 1]
  }

  /**
   * Listens for messages and activates or deactivates the cable accordingly.
   *
   * Checks the message topic and cable type to determine if the cable should
   * be deactivated. Checks if the message topic matches any activator topics
   * to determine if the cable should be activated.
   *
   * @param {Object} message - The message object containing the topic.
   */
  listen (message) {
    if (message.topic === Uc.topic.update && this.cabletype !== 'int') this.DeActivate()
    if (this.cabletype === 'int' && message.topic === 'inta') this.DeActivate()

    // Activate cable if message topic matches any activator topics
    if (this.activators.length > 0 && this.activators.find(element => {
      const regex = new RegExp(element)
      return regex.test(message.topic)
    })) this.Activate()
  }

  /**
   * Constructor for Cable SVG element
   *
   * @param {SVGContainer} container - SVG container to append cable to.
   * @param {string} id - Optional ID for cable.
   * @param {string} type - Type of cable (e.g. 'signal', 'int').
   * @param {string[]} activators - Topics that activate cable on message.
   */
  constructor (container, id = '', type = 'signal', activators) {
    super('polyline', '', id)

    // this.direction = direction;

    this.activators = activators || []
    this.cabletype = type
    this.points = ''
    this.pointArray = []

    this.group = new SVGGroup('path', this.id)
    container.append(this.group)

    this.group.append(this)

    this.group.addClass(this.cabletype + '-inactive')

    // TODO: Validate direction format

    // this.lineText = new SVGText(x - 3, y - 1, '', gr.gridSize);
    // this.lineText.addClass('wire-text');
    // this.group.append(this.lineText);

    this.lineText = ''
    this.arrows = []
    // if (!this.direction.match("[URDL]{2}")) {
    //     alert ('El formato de entrada no es correcto '+this.direction+', solo se admiten los caracteres URDL');
    // }

    // if (this.direction['0'] != 'N') this.group.append(this.arrowStart);
    // if (this.direction['1'] != 'N') this.group.append(this.arrowEnd);

    // this.redrawArrows();
  }

  /**
   * Adds a new point to the points array.
   * Checks if the new point matches the previous point on x or y before adding.
   * Pushes the new x,y point to the array.
   * Returns the Cable object for chaining.
   * Expects x,y point in px.
   *
   * @param {number} x - The x coordinate of the new point in px
   * @param {number} y - The y coordinate of the new point in px
   * @param {string} [axis='x'] - The axis to match 'x' or 'y'
   * @param {string} [label=''] - Optional label for the new point
   * @returns {Cable} The Cable object
   */
  addPoint (x, y, axis = 'x', label = '') {
    const pointArray = this.pointsArr; const npoints = pointArray.length

    if (npoints > 0) {
      const lastpoint = this.pointsArr[npoints - 1]
      if (x !== lastpoint[0] && y !== lastpoint[1]) {
        if (axis === 'x') pointArray.push([x, lastpoint[1]])
        else pointArray.push([lastpoint[0], y])
      }
    }

    pointArray.push([x, y])

    // if (label !== '' && labeledPoints.filter(item => item.id == label).length() == 0) labeledPoints.push({ id: label, idobj: this.id, obj: this, index: pointArray.length() - 1 })

    this.pointsArr = pointArray

    return this
  }

  addAnchorX (anchorlabel) {
    return this.addPoint(anchors.getAnchor(anchorlabel)[0], this.pointsArr[this.pointsArr.length - 1][1])
  }

  addAnchorY (anchorlabel) {
    return this.addPoint(this.pointsArr[this.pointsArr.length - 1][0], anchors.getAnchor(anchorlabel)[1])
  }

  addAnchor (anchorlabel) {
    return this.addPoint(...anchors.getAnchor(anchorlabel))
  }

  addArrow (direction, pointIndex, label = '') {
    const arrow = new SVGArrow('arrow-end'); const pointArr = this.pointsArr
    this.group.append(arrow)
    const boundBox = arrow.svg.getBoundingClientRect()
    arrow.translate(pointArr[pointIndex][0], pointArr[pointIndex][1] - boundBox.top)// .orientate(direction)
    arrow.orientate(direction)
    return this
  }

  /**
   * Sets the label text, position and offset for the cable line.
   *
   * @param {string} label - The label text
   * @param {number} i - The point index to position the label at
   * @param {string} HV - The horizontal and vertical alignment ('L'eft/'R'ight/'M'iddle, 'U'p/'D'own/'M'iddle)
   * @param {number} oh - Horizontal offset
   * @param {number} ov - Vertical offset
   */
  setLabel (label, i = 0, HV = 'MM', oh = 0, ov = 0) {
    if (this.lineText === '' && label !== '') {
      this.lineText = new SVGText(0, 0, '', gr.gridSize)
      this.group.append(this.lineText)
    }

    this.lineText.text = label

    const point = this.pointsArr[i]

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

  /**
   * Adds a point to the end of the cable by offsetting the last point.
   * Expects x increment and y increment in the unit provided by the property
   * currentUnit in the base class SVGElement.
   *
   * @param {number} x - Horizontal offset to add to last point x coordinate
   * @param {number} y - Vertical offset to add to last point y coordinate
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

  Activate () {
    // Re-append the cable to the DOM so that it is visible above other cables
    this.group.svg.parentNode.append(this.group.svg)

    this.group.removeClass(this.cabletype + '-inactive').addClass(this.cabletype + '-active')
    return this
  }

  DeActivate () {
    this.group.removeClass(this.cabletype + '-active').addClass(this.cabletype + '-inactive')
    return this
  }
}

export { SVGCable }
