# rk9-helper
tera-proxy module to help inside TERA dungeon `RK-9 Kennel`

## Usage
### `rk`
- Toggle on/off
- Default is off
### `rk status`
- Send status of guide and messenger
### `rk guide`
- Toggle RK-9 Kennel (hard) mechanic guide on/off
- Default is on
### `rk guild`
- Send mechanic order in guild chat
- Default is off
### `rk notice`
- Send mechanic order in party notice chat
- Requires party leader status
- Default is off
### `rk party`
- Send mechanic order in party chat
- Default is off
### `rk num`
- `num` is 1 to 4, instant move to device
### `rk lobby`
- Instant move to lobby area
### `rk boss num`
- `num` is 1 to 3, instant move to boss

## Info
- Initially made to make dismantling device easier
- Cannot use guild chat, party chat, and/or notice chat together- adjusts automatically
- WARNING : `rk lobby` may cause client to disconnect
- WARNING : `rk boss num` may cause lobby teleportals to bug and/or client to disconnect

## Changelog
### 1.23
- Updated code
- Removed protocol version restriction
### 1.22
- Fixed error
- Removed redundant code
- Reorganized code
- Redesigned part of code
### 1.21
- Fixed error
- Removed random whitespace
### 1.2
- Added messenger for initial hook
- Added `status` command
### 1.1
- Removed redundant code
- Refined code
- Added guild chat option
### 1.0
- Initial commit
