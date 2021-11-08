import { Component } from '@angular/core';

@Component({
  selector: 'app-what-to-chat-on',
  templateUrl: './what-to-chat-on.component.html',
  styleUrls: ['./what-to-chat-on.component.scss']
})
export class WhatToChatOnComponent {
  currentlySelectedItem: any;
  arrayOfApps = [
    {
      id: 0,
      name: 'Twitter',
      imageUrl: 'assets/twitter-logo.jpg'
    },
    {
      id: 1,
      name: 'Snapchat',
      imageUrl: 'assets/snapchat-logo.png'
    },
    {
      id: 2,
      name: 'Facebook',
      imageUrl: 'assets/facebook-logo.png'
    },
    {
      id: 3,
      name: 'Instagram',
      imageUrl: 'assets/instagram-logo.png'
    },
  ];

  startSpinner() {
    const interval = setInterval(this.setCurrentlySelectedItem.bind(this), 200);

    setTimeout(() => {
      clearInterval(interval);
    }, 3000);
  }

  setCurrentlySelectedItem() {
    const randomNumber = this.getRandomInt(0, this.arrayOfApps.length - 1);
    this.currentlySelectedItem = this.arrayOfApps[randomNumber];
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
