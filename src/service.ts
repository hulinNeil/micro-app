import kiple from "kiple-platform/service/api/index";
import { define, require } from "@/core/service/helpers/require";
import { Page, getCurrentPages } from "@/core/service/page/page";
import { App, getApp } from "@/core/service/page/app";
import { Component } from "@/core/service/page/component";
import { initApp } from "./core/service/initApp";

const pageFunction = { App, Page, Component, getApp, getCurrentPages };

class KipleApp {
  constructor() {
    this._init();
  }

  _init() {
    Object.assign(
      window,
      pageFunction,
      { wx: kiple },
      { define, require, initApp }
    );

    window.serviceJSBridge = {
      subscribe: KipleServiceJSBridge.subscribe,
      publishHandler: KipleServiceJSBridge.publishHandler,
      subscribeHandler: KipleServiceJSBridge.subscribeHandler,
    };
  }
}
new KipleApp();
