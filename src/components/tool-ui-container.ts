import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { toolUiState } from '../store/appState';
import './shape-selector';

@customElement('tool-ui-container')
export class ToolUiContainer extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
    }
    
    /* Allow pointer events on children */
    :host > * {
      pointer-events: auto;
    }
  `;

  render() {
    const uiState = toolUiState.get();

    if (!uiState) return html``;

    if (uiState.name === 'shape-selector') {
      return html`
        <shape-selector
          .family="${uiState.family}"
          .type="${uiState.type}"
          .templatesNames="${uiState.templatesNames}"
          .selectedTemplate="${uiState.selectedTemplate}"
          .nextStep="${uiState.nextStep}"
        ></shape-selector>
      `;
    }

    return html``;
  }
}
