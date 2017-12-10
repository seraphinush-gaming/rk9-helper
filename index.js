// OPCODE REQUIRED :
// - C_CHAT
// - S_ACTION_END
// - S_ACTION_STAGE
// - S_BOSS_GAGE_INFO
// - S_DUNGEON_EVENT_MESSAGE
// - S_LOAD_TOPO
// - S_LOGIN
// - S_QUEST_BALLOON
// - S_SPAWN_ME

// Version 1.3e r:00

// For a certain color OCD baka. ex: 'seraphinudez'.clr('BADA55')
String.prototype.clr = function(hexColor) {
  return `<font color="#${hexColor}">${this}</font>`
}

const Command = require('command'),
  KOREAN_VER = 323767

module.exports = function RK9Helper(d) {
  const command = Command(d)
    
  let cid, enabled = false,
    // Guide
    prevZone, curZone,
    curBoss, channelNum,
    prevMechFirst = true,
    // Msgs
    messageA = '',
    messageB = 'O',
    MECH_STRINGS = [],
    recipient = 'Self'

  // Message language
  d.hookOnce('S_LOAD_CLIENT_USER_SETTING', 1, () => {
    MECH_STRINGS = d.base.protocolVersion === KOREAN_VER?
      ['근', '원', '터'] : ['get OUT', 'get IN', 'WAVE']
  })

  d.hook('S_LOGIN', (e) => {
      ({ cid } = e)
      curBoss = prevZone = null
  })

  d.hook('S_LOAD_TOPO', (e) => {
      prevZone = curZone,
      curZone = e.zone
  })

  d.hook('S_SPAWN_ME', (e) => {
    if (!enabled || !RK9_ZONE.includes(curZone) ||
        prevZone !== SAVAGE_REACH || curZone === prevZone) return
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
    if ([SECOND_IN, SECOND_OUT, SECOND_SPD].includes(e.skill)) {
      messageA = messageB,
      messageB = 'O'
      setTimeout(toChat, 8000, 'Next : ' + messageA)
    }
  })

  const RESPONSES = {
    9935302: () => { messageA = MECH_STRINGS[0] },
    9935303: () => { messageA = MECH_STRINGS[1] },
    9935304: () => { messageA = MECH_STRINGS[2] },
    9935311: () => { prevMechFirst = true },
    9935312: () => { prevMechFirst = false }
  }
  d.hook('S_DUNGEON_EVENT_MESSAGE', (e) => {
    if (!enabled || curBoss !== RK9_THIRD_BOSS) return
    let messageId = parseInt(e.message.replace('@dungeon:', ''))
    if (messageId in RESPONSES) {
      RESPONSES[messageId]()
      setTimeout(mechOrder, 2000)
    }
  })

  d.hook('S_QUEST_BALLOON', (e) => {
    if (!enabled || curBoss !== RK9_THIRD_BOSS) return
    // Relevant IDs range from 935301 to 935303
    let index = parseInt(e.message.replace('@monsterBehavior:', '')) - 935301
    if (index in MECH_STRINGS) messageB = MECH_STRINGS[index]
  })

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

  // Add commands
  const COMMANDS = {
    status: () => { statusMsg() },
    test: () => { sendLines('Test:', ...MECH_STRINGS) }
  }
  // Add channel options
  const CHANNELS = { self: 0, party: 1, guild: 2, notice: 22 }

  try {
    command.add('rk', (arg) => {
      if (!arg) {
        enabled = !enabled
        statusMsg()
      }
      else if ((arg = arg.toLowerCase()) in COMMANDS) COMMANDS[arg]()
      else if (arg in CHANNELS) {
        recipient = arg.charAt(0).toUpperCase() + arg.slice(1)
        channelNum = CHANNELS[arg]
        statusMsg()
      }
      else send('Invalid argument.'.clr('FF0000'))
    })

  } catch (e) { console.error(`[ERROR] -- rk9-helper module --`) }

  function send(msg) { command.message(`[rk9-helper] : ` + msg) }

  function sendLines() { send([...arguments].join('\n\t - ')) }

  function statusMsg() {
    sendLines('Status :',
      `Guide ${enabled? 'On' : 'Off'}`,
      `Message to ${channelNum? recipient : 'Self'}`)
  }
}

const SAVAGE_REACH = 7031,
  RK9_THIRD_BOSS = 3000,
  RK9_ZONE = [9735, 9935],
  RK9_LOBBY = {x: -41429.887, y: 40626.555, z: -950.874},

  START = 1202128153, // 패턴 시작
  FIRST_IN = 1202128156, // first_근
  FIRST_OUT = 1202128157, // first_원
  FIRST_SPD = 1202128158, // first_전
  SECOND_IN = 1202128160, // second_근
  SECOND_OUT = 1202128161, // second_원
  SECOND_SPD = 1202128162, // second_전
  QUEST_IN = 935301, // 근
  QUEST_OUT = 935302, // 전
  QUEST_SPD = 935303 // 원
