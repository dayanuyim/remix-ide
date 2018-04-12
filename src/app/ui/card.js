var yo = require('yo-yo')
var csjs = require('csjs-inject')
var styleGuide = require('./styles-guide/theme-chooser')
var styles = styleGuide.chooser()
var EventManager = remixLib.EventManager

module.exports = class Card {
  constructor (api, events, opts) {
    const self = this
    self._api = api
    self._events = events
    self._opts = opts
    self._view = {}
    self.event = new EventManager()
  }
  render () {
    const self = this
    if (self._view.el) return self._view.el

    self._view.collapsedView = self._opts.collapsedView()
    self._view.expandedView = self._opts.expandedView()

    self._view.arrowUp = yo`
      <i class="${css.arrowUp} fa fa-angle-up"
      onclick=${(ev) => self.event.trigger('expandCollapseCard', [ev])}>
      </i>`
    self._view.arrowDown = yo`
    <i class="${css.arrowDown} fa fa-angle-down"
    onclick=${(ev) => self.event.trigger('expandCollapseCard', [ev])}>
    </i>`

    self._view.expandCollapseButton = yo`
    <div class=${css.expandCollapseButton}>${self._view.arrowUp}</div>`

    self._view.cardHeader = yo`
      <div class=${css.cardHeader}>
        <div class=${css.cardTitles}>
          <div class=${css.cardTitle}>${self._opts.title}</div>
          <div class=${css.cardSubitle}>${self._opts.subtitle}</div>
        </div>
        ${self._view.expandCollapseButton}
      </div>`

    self._view.cardBody = yo`
      <div class=${css.cardBody}>
        ${self._view.collapsedView}
      </div>
    `

    // HTML
    self._view.el = yo`
      <div class=${css.cardContainer}>
        ${self._view.cardHeader}
        ${self._view.cardBody}
      </div>`

    return self._view.el
  }
  // FUNCTIONS
  appendExpandedOrCollapsedView () {
    // var cardBody = self._view.cardBody
    //self._view.expandCollapseButton.innerHTML = self._view.arrowDown
    // cardBody.parentNode.removeChild(cardBody)
    // button.parentNode.removeChild(self._view.cardBody)
    // self._view.cardBody.appendChild(self._view.cardBody)
  }
}

const css = csjs`
  .cardContainer {
    ${styles.rightPanel.runTab.box_Instance};
    padding             : 10px 0px 15px 15px;
    margin-bottom       : 2%;
  }
  .cardHeader {
    display             : flex;
    justify-content     : space-between;
    margin-bottom       : 15px;
  }
  .cardBody {}
  .cardTitles {
    display             : flex;
    flex-direction      : column;
  }
  .cardTitle {
    font-size           : 13px;
    font-weight         : bold;
    color               : ${styles.appProperties.mainText_Color};
  }
  .cardSubitle {
    font-size           : 12px;
    color               : ${styles.appProperties.supportText_Color};
  }
  .expandCollapseButton {}
  .arrowUp,
  .arrowDown {
    margin-right        : 15px;
    color               : ${styles.appProperties.icon_Color};
    font-weight         : bold;
    cursor              : pointer;
    font-size           : 14px;
  }
  .arrowUp:hover,
  .arrowDown:hover {
    color               : ${styles.appProperties.icon_HoverColor};
  }

`
