import { defineInputAssets } from '@core/lib/serialization/assets/defineInputAssets';
import { ActionType, ControlType, DeviceType, CompositeType } from '@core';

/**
 * Scene Input Assets
 * 1 input action map
 */
export default defineInputAssets([
  {
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
        "enabled": true,
        "actions": [
          {
            "name": "Move",
            "actionType": "passthrough",
            "controlType": "vector2",
            "enabled": true,
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
            ]
          },
          {
            "name": "Jump",
            "actionType": "button",
            "controlType": "button",
            "enabled": true,
            "bindings": [
              {
                "type": "keyboard",
                "path": "space"
              }
            ]
          },
          {
            "name": "Fire",
            "actionType": "button",
            "controlType": "button",
            "enabled": true,
            "bindings": [
              {
                "type": "mouse",
                "path": "leftButton"
              },
              {
                "type": "keyboard",
                "path": "f"
              }
            ]
          },
          {
            "name": "Look",
            "actionType": "passthrough",
            "controlType": "vector2",
            "enabled": true,
            "bindings": [
              {
                "type": "mouse",
                "path": "delta"
              }
            ]
          }
        ]
      },
      {
        "name": "UI",
        "enabled": true,
        "actions": [
          {
            "name": "Navigate",
            "actionType": "passthrough",
            "controlType": "vector2",
            "enabled": true,
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
            ]
          },
          {
            "name": "Submit",
            "actionType": "button",
            "controlType": "button",
            "enabled": true,
            "bindings": [
              {
                "type": "keyboard",
                "path": "enter"
              },
              {
                "type": "keyboard",
                "path": "space"
              }
            ]
          },
          {
            "name": "Cancel",
            "actionType": "button",
            "controlType": "button",
            "enabled": true,
            "bindings": [
              {
                "type": "keyboard",
                "path": "escape"
              }
            ]
          }
        ]
      }
    ]
  }
]);
