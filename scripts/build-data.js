const fs = require('fs')
const request = require('request-promise')
const merge = require('deepmerge')

const overrides = require('../data/overrides.json')
const types = require('../data/types.json')

const createPokemon = require('../utils/createPokemon').default

const capitalizeString = (str) =>
  str.charAt(0).toUpperCase() + str.substr(1).toLowerCase()

const PVPOKE_RANKINGS = {
  great:
    'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gobattleleague/overall/rankings-1500.json',
  ultra:
    'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gobattleleague/overall/rankings-2500.json',
  master:
    'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gobattleleague/overall/rankings-10000.json',
}

const GAME_MASTER_URL =
  'https://raw.githubusercontent.com/pokemongo-dev-contrib/pokemongo-game-master/master/versions/latest/GAME_MASTER.json'

// TODO: Make array
const forms = {
  ALOLA: '(Alolan)',
  GALARIAN: '(Galarian)',
  ORIGIN: '(Origin)',
  ALTERED: '(Altered)',
  ARMORED: '(Armored)',
  LIBRE: '(Libre)',
  RAINY: '(Rainy)',
  SUNNY: '(Sunny)',
  SNOWY: '(Snowy)',
  ATTACK: '(Attack)',
  DEFENSE: '(Defense)',
  SPEED: '(Speed)',
  PLANT: '(Plant)',
  SANDY: '(Sandy)',
  TRASH: '(Trash)',
  OVERCAST: '(Overcast)',
  INCARNATE: '(Incarnate)',
  THERIAN: '(Therian)',
  FAN: '(Fan)',
  FROST: '(Frost)',
  HEAT: '(Heat)',
  MOW: '(Mow)',
  WASH: '(Wash)',
  LAND: '(Land)',
  SKY: '(Sky)',
  ZEN: '(Zen)',
  AUTUMN: '(Autumn)',
  WINTER: '(Winter)',
  SPRING: '(Spring)',
  SUMMER: '(Summer)',
  BLACK: '(Black)',
  WHITE: '(White)',
  ARIA: '(Aria)',
  PIROUETTE: '(Pirouette)',
  BURN: '(Burn)',
  CHILL: '(Chill)',
  DOUSE: '(Douse)',
  SHOCK: '(Shock)',
  ORDINARY: '(Ordinary)',
  RESOLUTE: '(Resolute)',
}

for (let type in types) {
  forms[type.toUpperCase()] = '(' + capitalizeString(type) + ')'
}

const formMap = {
  VS_2019: 'PIKACHU_LIBRE',
  MEWTWO_A: 'MEWTWO_ARMORED',
}

const nameReplace = {
  NIDORAN_FEMALE: 'Nidoran ♀',
  NIDORAN_MALE: 'Nidoran ♂',
  MIME_JR: 'Mime Jr.',
  PORYGON_Z: 'Porygon-Z',
  MR_MIME: 'Mr. Mime',
  HO_OH: 'Ho-Oh',
}

const normalizeName = (name) => {
  name = name.replace('_NORMAL', '')

  if (nameReplace[name]) {
    return nameReplace[name]
  }

  const newName = name.split('_').map(capitalizeString).join(' ')

  return Object.keys(forms).reduce(
    (n, form) => n.replace(' ' + capitalizeString(form), ' ' + forms[form]),
    newName
  )
}

function getUsefulForm(form) {
  if (
    !form ||
    form.match(
      /PURIFIED|SHADOW|NORMAL|FALL_2019|COPY_2019|EAST_SEA|WEST_SEA|STRIPED|STANDARD/gi
    ) !== null
  ) {
    return undefined
  }

  for (let key in formMap) {
    if (form.indexOf(key) !== -1) {
      return formMap[key]
    }
  }

  return form
}

let generate = async () => {
  const GAME_MASTER = await request.get({
    url: GAME_MASTER_URL,
    json: true,
  })

  // Examples:
  // V0001_POKEMON_BULBASAUR
  // V0122_POKEMON_MR_MIME
  // V0233_POKEMON_PORYGON2
  let pokemonTemplateIdPattern = /^V[0-9]{4}_POKEMON_[a-zA-Z0-9_]+$/
  let moveTemplateIdPattern = /^V[0-9]{4}_MOVE_[a-zA-Z0-9_]+$/
  let pvpMoveTemplateIdPattern = /^COMBAT_V[0-9]{4}_MOVE_[a-zA-Z0-9_]+$/

  const excludePokemon = { V0487_POKEMON_GIRATINA: true }

  const pokemonTemplates = GAME_MASTER.itemTemplate.filter((template) => {
    return excludePokemon[template.templateId]
      ? false
      : pokemonTemplateIdPattern.test(template.templateId)
  })

  const moveTemplates = GAME_MASTER.itemTemplate.filter((template) => {
    return moveTemplateIdPattern.test(template.templateId)
  })

  const pvpMoveTemplates = GAME_MASTER.itemTemplate.filter((template) => {
    return pvpMoveTemplateIdPattern.test(template.templateId)
  })

  let pokemonList = []
  pokemonTemplates.map((template) => {
    const {
      pokemon: {
        uniqueId,
        form,
        evolutionBranch,
        kmBuddyDistance,
        type1,
        type2,
        quickMoves,
        cinematicMoves,
        eliteQuickMove,
        eliteCinematicMove,
        thirdMove,
        stats,
      },
      templateId,
    } = template

    const ref = getUsefulForm(form) || uniqueId
    const name = normalizeName(ref)

    if (!pokemonList.find((p) => p.name === name)) {
      pokemonList.push({
        name,
        ref: ref.toLowerCase(),
        id: parseInt(templateId.match(/[0-9]{4}/)[0]),
        attack: stats.baseAttack,
        defense: stats.baseDefense,
        stamina: stats.baseStamina,
        candyDistance: kmBuddyDistance,
        evolutions:
          evolutionBranch && evolutionBranch[0].evolution
            ? evolutionBranch
                .map((b) => getUsefulForm(b.form) || b.evolution)
                .map(normalizeName)
            : [],
        type1: type1.substr(13).toLowerCase(),
        type2: type2 ? type2.substr(13).toLowerCase() : undefined,
        thirdMove,
        quickMoves,
        cinematicMoves,
        eliteQuickMoves: eliteQuickMove || [],
        eliteCinematicMoves: eliteCinematicMove || [],
      })
    }
  })

  const moveList = {}
  moveTemplates.map((template) => {
    const {
      move: {
        power,
        pokemonType,
        movementId,
        energyDelta,
        accuracyChance,
        durationMs,
      },
      templateId,
    } = template

    moveList[movementId] = {
      name: movementId
        .replace('_FAST', '')
        .split('_')
        .map(normalizeName)
        .join(' '),
      type: pokemonType.substr(13).toLowerCase(),
      pve: {
        damage: power || 0,
        energy: Math.abs(energyDelta) || 0,
        accuracy: accuracyChance,
        turns: durationMs / 1000,
      },
    }
  })

  pvpMoveTemplates.map((template) => {
    const {
      combatMove: { power, uniqueId, energyDelta, durationTurns },
    } = template

    moveList[uniqueId].pvp = {
      damage: power || 0,
      energy: Math.abs(energyDelta) || 0,
      turns: durationTurns ? durationTurns + 1 : 1,
    }
  })

  Object.keys(overrides.pokedex).forEach((pokemon) => {
    const entry = pokemonList.find((item) => item.ref === pokemon)
    const index = pokemonList.indexOf(entry)

    if (index >= 0) {
      pokemonList[index] = merge(entry, overrides.pokedex[pokemon])
    } else {
      pokemonList.push(overrides.pokedex[pokemon])
    }
  })

  pokemonList = pokemonList.sort((a, b) => {
    return a.id === b.id ? (a.name > b.name ? 1 : -1) : a.id - b.id
  })

  Object.keys(overrides.moves).forEach((move) => {
    moveList[move] = merge(moveList[move], overrides.moves[move])
  })

  // clean up old unused moves
  for (let key in moveList) {
    if (
      !moveList[key].hasOwnProperty('pvp') ||
      moveList[key].name.indexOf('Blastoise') !== -1
    ) {
      delete moveList[key]
    }
  }

  const pvpStats = {}

  function getPvpStats({ attackIV, defenseIV, staminaIV, level, cp, hp }) {
    return {
      attack: attackIV,
      defense: defenseIV,
      stamina: staminaIV,
      level,
      cp,
      hp,
    }
  }

  pokemonList.map((pokemon) => {
    const poke = createPokemon(pokemon.name, {
      attack: 0,
      defense: 0,
      stamina: 0,
    })

    const great = poke.getPVPRankings({ CPCap: 1500 })
    const ultra = poke.getPVPRankings({ CPCap: 2500 })
    const master = poke.getPVPRankings({ CPCap: 10000 })

    pvpStats[pokemon.name] = {
      great: getPvpStats(great[499]),
      ultra: getPvpStats(ultra[499]),
      master: getPvpStats(master[499]),
    }
  })

  const great = await request.get({
    url: PVPOKE_RANKINGS.great,
    json: true,
  })

  const ultra = await request.get({
    url: PVPOKE_RANKINGS.ultra,
    json: true,
  })

  const master = await request.get({
    url: PVPOKE_RANKINGS.master,
    json: true,
  })

  fs.writeFile(
    './data/pokedex.json',
    JSON.stringify(pokemonList, null, '  '),
    (err) => {
      if (err) {
        console.log(`Could not write file: ${err.message}.`)
        return process.exit(1)
      } else {
        console.log(
          `Successfully fetched ${pokemonList.length} Pokémon and updated their stats.`
        )
      }
    }
  )

  fs.writeFile(
    './data/pvprankings.json',
    JSON.stringify(
      {
        great,
        ultra,
        master,
      },
      null,
      '  '
    ),
    (err) => {
      if (err) {
        console.log(`Could not write file: ${err.message}.`)
        return process.exit(1)
      }
      console.log('Successfully fetched all pvp rankings from pvpoke.')
    }
  )

  fs.writeFile(
    './data/pvpstats.json',
    JSON.stringify(pvpStats, null, '  '),
    (err) => {
      if (err) {
        console.log(`Could not write file: ${err.message}.`)
        return process.exit(1)
      }
      console.log('Successfully extracted pvp stats for each pokemon.')
    }
  )

  fs.writeFile(
    './data/moves.json',
    JSON.stringify(moveList, null, '  '),
    (err) => {
      if (err) {
        console.log(`Could not write file: ${err.message}.`)
        return process.exit(1)
      } else {
        console.log(
          `Successfully fetched ${
            Object.keys(moveList).length
          } moves and updated their stats.`
        )
      }
    }
  )
}

generate()
