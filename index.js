// OPCODE REQUIRED :
// - C_CHAT
// - S_ACTION_END
// - S_ACTION_STAGE
// - S_BOSS_GAGE_INFO
// - S_DUNGEON_EVENT_MESSAGE
// - S_INSTANT_MOVE
// - S_LOAD_TOPO
// - S_LOGIN
// - S_QUEST_BALLOON
// - S_SPAWN_ME

const Command = require('command')

module.exports = function RK9Helper(dispatch) {

    const command = Command(dispatch)

    let cid,
        enable = false,
        prevZone = null,
        curZone = null

    let channelNum = 0,
        chatGuild = false,
        chatNotice = false,
        chatParty = false,
        curBoss = 0,
        guideEnable = true,
        messageA = '',
        messageB = '??',
        previousMechFirst = true,
        temp = ''

    // code
    dispatch.hook('S_LOGIN', (event) => {
        ({ cid } = event)
        prevZone = null
    })

    dispatch.hook('S_LOAD_TOPO', (event) => {
        prevZone = curZone,
        curZone = event.zone
    })

    function moveLocation(loc) {
        dispatch.toClient('S_INSTANT_MOVE', 1, {
            id: cid,
            x: loc[0],
            y: loc[1],
            z: loc[2]
        })
    }

    dispatch.hook('S_SPAWN_ME', 1, (event) => {
        if (!enable && !(RK9_ZONE.includes(curZone))) return
        if (prevZone != SAVAGE_REACH) return
        if (curZone == prevZone) return
        event.x = RK9_LOBBY[0],
        event.y = RK9_LOBBY[1],
        event.z = RK9_LOBBY[2]
        return true
    })

    // RK-9 Kennel (hard) last boss guide code
    dispatch.hook('S_BOSS_GAGE_INFO', (event) => {
        if (!enable && !(RK9_ZONE.includes(curZone))) return
        curBoss = event.templateId
    })

    dispatch.hook('S_ACTION_STAGE', (event) => {
        if (!guideEnable) return
        if (curBoss != RK9_THIRD_BOSS) return
        if (event.skill === START) {
            setTimeout(mechOrder, 500)
        }
    })

    dispatch.hook('S_ACTION_END', (event) => {
        if (!guideEnable) return
        if (curBoss != RK9_THIRD_BOSS) return
        switch (event.skill) {
            case SECOND_IN:
            case SECOND_OUT:
            case SECOND_SPD:
                messageA = messageB,
                messageB = '??'
                break
            default:
                return
        }
        setTimeout(() => {
            if (channelNum != 0) {
                sendChat(`Next : ` + messageA)
            } else {
                send(`Next : ` + messageA)
            }
        }, 8000)
    })

    // initial message hook
    dispatch.hook('S_DUNGEON_EVENT_MESSAGE', (event) => {
        if (!guideEnable) return
        if (curBoss != RK9_THIRD_BOSS) return
        let messageId = parseInt(event.message.replace('@dungeon:', ''))
        switch (messageId) {
            // edit first three cases for translation
            case 9935302:
                messageA = '근' // IN
                break
            case 9935303:
                messageA = '원' // OUT
                break
            case 9935304:
                messageA = '터' // SPREAD
                break
            case 9935311:
                previousMechFirst = true
                setTimeout(() => {
                    if (channelNum != 0) {
                        sendChat(messageA + ` -> O`)
                    } else {
                        send(messageA + ` -> O`)
                    }
                }, 2000)
                break
            case 9935312:
                previousMechFirst = false
                setTimeout(() => {
                    if (channelNum != 0) {
                        sendChat(`O -> ` + messageA)
                    } else {
                        send(`O ->` + messageA)
                    }
                }, 2000)
                break
            default:
                return
        }
        // if first message
        if (messageId != 9935311 || message != 9935312) {
            if (channelNum != 0) {
                sendChat(`First : ` + messageA)
            } else {
                send(`First : ` + messageA)
            }
        }
    })

    dispatch.hook('S_QUEST_BALLOON', 1, (event) => {
        if (!guideEnable) return
        if (curBoss != RK9_THIRD_BOSS) return
        let balloonId = parseInt(event.message.replace('@monsterBehavior:', ''))
        switch (balloonId) {
            // edit these three cases for translation
            case 935301:
                messageB = '근' // IN
                break
            case 935302:
                messageB = '원' // OUT
                break
            case 935303:
                messageB = '터' // SPREAD
                break
        }
    })

    // helper
    function mechOrder() {
        if (previousMechFirst) {
            if (channelNum != 0) {
                sendChat(messageA + ` -> ` + messageB)
            } else {
                send(messageA + ` -> ` + messageB)
            }
        } else {
            if (channelNum != 0) {
                sendChat(messageB + ` -> ` + messageA)
            } else {
                send(messageB + ` -> ` + messageA)
            }
        }
    }

    function send(msg) {
        command.message(`[rk9-helper] : ` + msg)
    }

    function sendChat(msg) {
        dispatch.toServer('C_CHAT', {
            channel: channelNum, // 1 = party, 2 = guild, 21 = party notice
            message: msg
        })
    }

    // command
    try {
        command.add('rk', (p1, p2) => {
            if (p1 === undefined) {
                enable = !enable
                if (chatGuild) { temp = 'Guild' }
                else if (chatNotice) { temp = 'Notice' }
                else if (chatParty) { temp = 'Party' }
                else { temp = 'Self' }
                send(`RK-9 Hangar module ${enable ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'}<font>.</font>`)
                send(`Status : 
                    <br> - Guide : ${guideEnable}
                    <br> - Message to : ${temp}`)
                return
            }
            if (!enable) {
                send(`<font color="#FF0000">Offline.</font>`)
                return
            }
            if (p1 == 'status') {
                send(`Status : 
                <br> - Guide : ${guideEnable}
                <br> - Message to : ${temp}`)
                return
            }
            if (p1 == 'guide') {
                guideEnable = !guideEnable
                send(`Guide ${guideEnable ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'}<font>.</font>`)
                return
            }
            if (p1 == 'guild') {
                if (!guideEnable) {
                    send(`<font color="#FF0000">Guide is disabled.</font>`)
                    return
                }
                chatGuild = !chatGuild
                chatGuild ? (channelNum = 2, chatNotice = false, chatParty = false) : channelNum = 0
                send(`Message to guild chat ${chatGuild ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'}<font>.</font>`)    
                return
            }
            if (p1 == 'notice') {
                if (!guideEnable) {
                    send(`<font color="#FF0000">Guide is disabled.</font>`)
                    return
                }
                chatNotice = !chatNotice
                chatNotice ? (channelNum = 21, chatGuild = false, chatParty = false) : channelNum = 0
                send(`Message to notice chat ${chatNotice ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'}<font>.</font>`)
                return
            }
            if (p1 == 'party') {
                if (!guideEnable) {
                    send(`<font color="#FF0000">Guide is disabled.</font>`)
                    return
                }
                chatParty = !chatParty
                chatParty ? (channelNum = 1, chatGuild = false, chatNotice = false) : channelNum = 0
                send(`Message to party chat ${chatParty ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'}<font>.</font>`)
                return
            }
            if (!(RK9_ZONE.includes(curZone))) {
                send(`<font color="#FF0000">Invalid zone.</font>`)
                return
            }
            if (!isNaN(p1)) {
                if (p1 < 1 || p1 > 4) {
                    send(`<font color="#FF0000">Invalid number.</font>`)
                    return
                } else {
                    moveLocation(RK9_DEVICE_LOCATION[p1])
                    send(`Instant move to position <font color="#56B4E9">` + p1 + `</font><font>.</font>`)
                    return
                }
            }
            if (p1 == 'lobby') {
                moveLocation(RK9_LOBBY)
                send(`Instant move to <font color="#56B4E9">lobby</font><font>.</font>`)
                return
            }
            if (p1 == 'boss' && !isNaN(p2)) {
                if (p2 < 1 || p2 > 3) {
                    send(`<font color="#FF0000">Invalid number.</font>`)
                    return
                } else {
                    moveLocation(RK9_BOSS_LOCATION[p2])
                    send(`Instant move to boss <font color="#56B4E9">` + p2 + `</font><font> location.</font>`)
                    return
                }
            } else {
                send(`<font color="#FF0000">Invalid argument.</font>`)
            }
        })
    } catch (e) {
        console.log(`[ERROR] -- rk9-helper module --`)
    }

}

// constants
const RK9_DEVICE_LOCATION = {
    1: [-44591.781, 49384.055, 0.25],
    2: [-44584, 48114.629, 0.25],
    3: [-43328.5, 48118.527, 0.25],
    4: [-43328, 49370.785, 0.25]
}
const RK9_BOSS_LOCATION = {
    1: [-38366, 54391, 0.25],
    2: [-32878.3632, 58849.367, 0.25],
    3: [-33766, 40637, 22.25]
}
const RK9_LOBBY = [-41429.887, 40626.555, -950.874]
const RK9_ZONE = [9735, 9935]
const SAVAGE_REACH = 7031

const RK9_THIRD_BOSS = 3000

const START = 1202128153 // 패턴 시작
const FIRST_IN = 1202128156 // first_근
const FIRST_OUT = 1202128157 // first_원
const FIRST_SPD = 1202128158 // first_전
const SECOND_IN = 1202128160 // second_근
const SECOND_OUT = 1202128161 // second_원
const SECOND_SPD = 1202128162 // second_전
const MSG_IN = 935301 // 근
const MSG_OUT = 935302 // 전
const MSG_SPD = 935303 // 원
