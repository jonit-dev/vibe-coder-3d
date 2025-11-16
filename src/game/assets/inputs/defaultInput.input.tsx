import { defineInputAsset } from '@core/lib/serialization/assets/defineInputAssets';
import { ActionType, ControlType, DeviceType, CompositeType } from '@core';

export default defineInputAsset({
    "name": "Default Input",
    "controlSchemes": [
      {
        "name": "Keyboard & Mouse",
        "deviceRequirements": [
          {
            "deviceType": "keyboard",
            "optional": false
          },
          {
            "deviceType": "mouse",
            "optional": true
          }
        ]
      },
      {
        "name": "Gamepad",
        "deviceRequirements": [
          {
            "deviceType": "gamepad",
            "optional": false
          }
        ]
      }
    ],
    "actionMaps": [
      {
        "name": "Gameplay",
        "actions": [
          {
            "name": "Move",
            "actionType": "passthrough",
            "controlType": "vector2",
            "bindings": [
              {
                "compositeType": "2DVector",
                "bindings": {
                  "up": {
                    "type": "keyboard",
                    "path": "w"
                  },
                  "down": {
                    "type": "keyboard",
                    "path": "s"
                  },
                  "left": {
                    "type": "keyboard",
                    "path": "a"
                  },
                  "right": {
                    "type": "keyboard",
                    "path": "d"
                  }
                }
              },
              {
                "compositeType": "2DVector",
                "bindings": {
                  "up": {
                    "type": "keyboard",
                    "path": "arrowup"
                  },
                  "down": {
                    "type": "keyboard",
                    "path": "arrowdown"
                  },
                  "left": {
                    "type": "keyboard",
                    "path": "arrowleft"
                  },
                  "right": {
                    "type": "keyboard",
                    "path": "arrowright"
                  }
                }
              }
            ],
            "enabled": true
          },
          {
            "name": "Jump",
            "actionType": "button",
            "controlType": "button",
            "bindings": [
              {
                "type": "keyboard",
                "path": "space"
              }
            ],
            "enabled": true
          },
          {
            "name": "Fire",
            "actionType": "button",
            "controlType": "button",
            "bindings": [
              {
                "type": "mouse",
                "path": "leftButton"
              },
              {
                "type": "keyboard",
                "path": "f"
              }
            ],
            "enabled": true
          },
          {
            "name": "Look",
            "actionType": "passthrough",
            "controlType": "vector2",
            "bindings": [
              {
                "type": "mouse",
                "path": "delta"
              }
            ],
            "enabled": true
          }
        ],
        "enabled": true
      },
      {
        "name": "UI",
        "actions": [
          {
            "name": "Navigate",
            "actionType": "passthrough",
            "controlType": "vector2",
            "bindings": [
              {
                "compositeType": "2DVector",
                "bindings": {
                  "up": {
                    "type": "keyboard",
                    "path": "arrowup"
                  },
                  "down": {
                    "type": "keyboard",
                    "path": "arrowdown"
                  },
                  "left": {
                    "type": "keyboard",
                    "path": "arrowleft"
                  },
                  "right": {
                    "type": "keyboard",
                    "path": "arrowright"
                  }
                }
              }
            ],
            "enabled": true
          },
          {
            "name": "Submit",
            "actionType": "button",
            "controlType": "button",
            "bindings": [
              {
                "type": "keyboard",
                "path": "enter"
              },
              {
                "type": "keyboard",
                "path": "space"
              }
            ],
            "enabled": true
          },
          {
            "name": "Cancel",
            "actionType": "button",
            "controlType": "button",
            "bindings": [
              {
                "type": "keyboard",
                "path": "escape"
              }
            ],
            "enabled": true
          }
        ],
        "enabled": true
      }
    ]
  });
