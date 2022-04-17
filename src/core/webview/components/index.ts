import Button from './button/index';
import View from './view';
import Text from './text';
import Image from './image';
import Navigator from './navigator';

const components = [Button, Image, View, Text, Navigator];

components.forEach((component) => {
  if (component.is) {
    window.customElements.define(component.is, component);
  }
});
