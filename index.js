// OPCODE REQUIRED :
// - C_CHAT
// - S_ACTION_END
// - S_ACTION_STAGE
// - S_BOSS_GAGE_INFO
// - S_DUNGEON_EVENT_MESSAGE
// - S_LOAD_CLIENT_USER_SETTING
// - S_LOAD_TOPO
// - S_LOGIN
// - S_QUEST_BALLOON
// - S_SPAWN_ME

// Version 1.43 r:00

const KTERA = [324044, 325714]
const Command = require('command')

const 
    RK9_THIRD_BOSS = 3000,
    RK9_ZONE = [9735, 9935],
    RK9_LOBBY = { x: -41429.887, y: 40626.555, z: -950.874 },
    START = 1202128153,
    SECOND_IN = 1202128160,
    SECOND_OUT = 1202128161,
    SECOND_WAVE = 1202128162

module.exports = function RK9Helper(d) {

    const command = Command(d)

        // general
    let enabled = false,
        cid, 
        name,

        // guide
        channelNum,
        curBoss,
        curZone,
        prevMechFirst = true,
        prevZone, 

        // messages
        MECH_STRINGS = [],
        messageA = '',
        messageB = 'O',
        recipient = 'Self'

    // message language
    d.hookOnce('S_LOAD_CLIENT_USER_SETTING', () => {
        MECH_STRINGS = (KTERA.includes(d.base.protocolVersion)) ?
            ['근', '원', '터'] : ['get OUT', 'get IN', 'WAVE']
    })

    d.hook('S_LOGIN', (e) => {
        ({ cid, name } = e)
        curBoss = prevZone = null
    })

    d.hook('S_LOAD_TOPO', (e) => {
        prevZone = curZone,
        curZone = e.zone
    })

    d.hook('S_SPAWN_ME', (e) => {
        if (!RK9_ZONE.includes(curZone) || curZone === prevZone) return
        Object.assign(e, RK9_LOBBY)
        return true
    })

    // RK-9 Kennel (hard) last boss guide code
    d.hook('S_BOSS_GAGE_INFO', (e) => {
        if (RK9_ZONE.includes(curZone)) curBoss = e.templateId
    })

    d.hook('S_ACTION_STAGE', (e) => {
        if (enabled && curBoss === RK9_THIRD_BOSS && e.skill === START)
            setTimeout(mechOrder, 500)
    })

    d.hook('S_ACTION_END', (e) => {
        if (!enabled || curBoss !== RK9_THIRD_BOSS) return
        if ([SECOND_IN, SECOND_OUT, SECOND_WAVE].includes(e.skill)) {
            messageA = messageB,
            messageB = 'O'
            setTimeout(toChat, 8000, 'Next : ' + messageA)
        }
    })

    d.hook('S_DUNGEON_EVENT_MESSAGE', (e) => {
        if (!enabled || curBoss !== RK9_THIRD_BOSS) return
        let messageId = parseInt(e.message.replace('@dungeon:', ''))
        if (messageId in DUNGEON_EVENT_RESPONSES) {
            DUNGEON_EVENT_RESPONSES[messageId]()
            setTimeout(mechOrder, 2000)
        }
    })

    const DUNGEON_EVENT_RESPONSES = {
        9935302: () => { messageA = MECH_STRINGS[0] },
        9935303: () => { messageA = MECH_STRINGS[1] },
        9935304: () => { messageA = MECH_STRINGS[2] },
        9935311: () => { prevMechFirst = true },
        9935312: () => { prevMechFirst = false }
    }

    d.hook('S_QUEST_BALLOON', (e) => {
        if (!enabled || curBoss !== RK9_THIRD_BOSS) return
        // relevant IDs range from 935301 to 935303
        let index = parseInt(e.message.replace('@monsterBehavior:', '')) - 935301
        if (index in MECH_STRINGS) messageB = MECH_STRINGS[index]
    })

    // helper
    function mechOrder() {
        if (prevMechFirst) toChat(messageA + ` -> ` + messageB)
        else toChat(messageB + ` -> ` + messageA)
    }

    function toChat(msg) {
        if (channelNum) d.toServer('C_CHAT', {
            channel: channelNum,
            message: msg
        })
        else send(msg)
    }

    // command
    const COMMANDS = {
        status: () => { status() }
    }
    // channel
    const CHANNELS = { self: 0, party: 1, guild: 2, notice: 22 }

    try {
        command.add('rk', (arg) => {
            if (!arg) {
                enabled = !enabled
                status()
            } 
            else if ((arg = arg.toLowerCase()) in COMMANDS) COMMANDS[arg]()
            else if (arg in CHANNELS) {
                recipient = arg.charAt(0).toUpperCase() + arg.slice(1)
                channelNum = CHANNELS[arg]
                send(`Message to : ` + `${channelNum ? recipient : name}`.clr('56B4E9'))
            }
            else send(`Invalid argument.`.clr('FF0000'))
        })
        function send(msg) { command.message(`[rk9-helper] : ` + [...arguments].join('\n\t - ')) }
        function status() { send(
                `RK-9 Helper ${enabled ? 'enabled'.clr('56B4E9') : 'disabled'.clr('E69F00')}` + `.`.clr('FFFFFF'),
                `Message to : ${channelNum ? recipient : name}`,
                `Messages : ${MECH_STRINGS}`)
        }
    } catch (e) { console.error(`[ERROR] -- rk9-helper module --`) }

}

// credit : https://github.com/Some-AV-Popo
String.prototype.clr = function (hexColor) { return `<font color="#${hexColor}">${this}</font>` }

// miscellaneous
const 
    SAVAGE_REACH = 7031,
    
    FIRST_IN = 1202128156,
    FIRST_OUT = 1202128157,
    FIRST_WAVE = 1202128158,
    QUEST_IN = 935301,
    QUEST_OUT = 935302,
    QUEST_WAVE = 935303
