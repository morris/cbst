import { hello } from './hello.js';

export function main() {
  hello('world');
  document.getElementById('welcome').src = '/assets/welcome.svg';
}
