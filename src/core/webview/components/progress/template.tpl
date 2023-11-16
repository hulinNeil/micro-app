<template>
  <style>
    :host {
      display: -webkit-flex;
      display: flex;
      -webkit-align-items: center;
      align-items: center;
    }

    :host([hidden]) {
      display: none !important;
    }

    .uni-progress-bar {
      -webkit-flex: 1;
      flex: 1;
    }

    .uni-progress-inner-bar {
      width: 0;
      height: 100%;
    }

    .uni-progress-info {
      margin-top: 0;
      margin-bottom: 0;
      min-width: 2em;
      margin-left: 15px;
      font-size: 16px;
    }
  </style>
  <div style="{{outerBarStyle}}" class="uni-progress-bar">
    <div style="{{innerBarStyle}}" class="uni-progress-inner-bar" />
  </div>
  <p class="uni-progress-info">{{ currentPercent }}%</p>
</template>