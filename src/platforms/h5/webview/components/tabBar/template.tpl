<template>
  <style>
    :host {
      display: block;
      width: 100%;
    }
    :host .uni-tabbar__placeholder {
      height: 50px;
    }
    :host .uni-tabbar {
      display: flex;
      height: 50px;
      width: 100%;
      position: fixed;
      z-index: 998;
      bottom: 0;
    }
    :host .uni-tabbar__border {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 1px;
      -webkit-transform: scaleY(0.5);
      transform: scaleY(0.5);
    }
    :host .uni-tabbar__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
    }
    :host .uni-tabbar__item-icon {
      width: 24px;
      height: 24px;
    }
    :host .uni-tabbar__item-icon img {
      width: 100%;
      height: 100%;
    }
    :host .uni-tabbar__item-text {
      font-size: 12px;
    }
  </style>
  <div class="uni-tabbar" style="background-color: {{backgroundColor}};">
    <div
      class="uni-tabbar__border"
      style="background-color: {{borderStyle === 'white' ? 'rgba(255, 255, 255, 0.33)' : 'rgba(0, 0, 0, 0.33)'}};"
    ></div>
    <div class="uni-tabbar__item" k:for="{{ list }}" onclick="_switchTab" data-index="{{ index }}">
      <div class="uni-tabbar__item-icon">
        <img src="/{{index === selectIndex ? item.selectedIconPath : item.iconPath}}" />
      </div>
      <div class="uni-tabbar__item-text" style="color: {{index === selectIndex ? selectedColor : color}};">{{item.text}}</div>
    </div>
  </div>
  <div class="uni-tabbar__placeholder"></div>
</template>
