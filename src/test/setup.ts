import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// A page that loads its code and its data may need more than the default second on a busy machine.
configure({ asyncUtilTimeout: 5000 })

// jsdom has no modal dialog support; the polyfill only toggles the open state.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

// jsdom does not implement scrolling; the router's scroll restoration only needs it not to complain.
window.scrollTo = () => undefined
