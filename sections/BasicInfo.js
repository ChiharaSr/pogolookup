import React, { useContext } from 'react'
import { Box, Spacer } from 'kilvin'
import { useFela } from 'react-fela'

import Layout from '../components/Layout'
import TypeTile from '../components/TypeTile'

import getImageUrl from '../utils/getImageUrl'
import AppContext from '../utils/AppContext'

const InfoDisplay = ({ children, name, columnOnMobile }) => (
  <Box
    direction={[columnOnMobile ? 'column' : 'row', 'row']}
    alignItems={[columnOnMobile ? 'flex-start' : 'center', 'center']}>
    <Box grow={0} basis={[columnOnMobile ? 'auto' : 150, 150]}>
      {name}:
    </Box>
    <Box grow={1}>{children}</Box>
  </Box>
)

export default function BaseInfo({ info, stats, pokemon, addBookmark }) {
  const { theme } = useFela()
  const { focusMode } = useContext(AppContext)

  const raidCatch = pokemon.getCPRangeAtLevel(20)
  const raidCatchWeatherBoost = pokemon.getCPRangeAtLevel(25)

  if (focusMode) {
    return (
      <Box alignItems="center" direction="row" space={3}>
        <Box
          alignItems="flex-start"
          alignSelf="flex-start"
          extend={{
            boxShadow: '0 0 0 2px rgba(0,0,0,0.2)',
            backgroundColor: 'white',
            borderRadius: 8,
          }}>
          <img height={70} width="auto" src={getImageUrl(info.id, info.name)} />
        </Box>
        <Box>
          <h1 style={{ fontSize: 20 }}>{info.name}</h1>
          <Box direction="row" space={1} alignItems="center">
            <TypeTile type={info.type1} />
            {info.type2 ? <TypeTile type={info.type2} /> : null}
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box direction={['column', , 'row']} space={4}>
      <Box order={[3, , -1]} grow={1} shrink={0} basis="70%">
        <h1>
          #{info.id} {info.name}
        </h1>
        <Box direction="row" space={1} alignItems="center">
          <TypeTile type={info.type1} />
          {info.type2 ? <TypeTile type={info.type2} /> : null}
        </Box>

        <Spacer size={1} />
        <p style={{ fontSize: 20 }}>
          {stats.cp} CP / {stats.hp} HP
        </p>
        <Spacer size={5} />

        <Box space={1.5}>
          <InfoDisplay name="Candy Distance">
            {info.candyDistance} km
          </InfoDisplay>
          <InfoDisplay name="Raid CP Range">
            {raidCatch.min} - {raidCatch.max}
          </InfoDisplay>
          <InfoDisplay name="  Weather-boost">
            {raidCatchWeatherBoost.min} - {raidCatchWeatherBoost.max}
          </InfoDisplay>

          <Spacer size={2} />
          <InfoDisplay name="Base Attack" columnOnMobile>
            <Box
              width={info.attack}
              extend={{
                backgroundColor: 'rgb(190, 190 ,190)',
                borderRadius: theme.roundedCorners,
                padding: '2px 6px',
              }}>
              {info.attack}
            </Box>
          </InfoDisplay>
          <InfoDisplay name="Base Defense" columnOnMobile>
            <Box
              width={info.defense}
              extend={{
                backgroundColor: 'rgb(190, 190 ,190)',
                borderRadius: theme.roundedCorners,
                padding: '2px 6px',
              }}>
              {info.defense}
            </Box>
          </InfoDisplay>
          <InfoDisplay name="Base Stamina" columnOnMobile>
            <Box
              width={info.stamina}
              extend={{
                backgroundColor: 'rgb(190, 190 ,190)',
                borderRadius: theme.roundedCorners,
                padding: '2px 6px',
              }}>
              {info.stamina}
            </Box>
          </InfoDisplay>
        </Box>
      </Box>
      <Box order={[-1, , 3]} space={1}>
        <Box
          alignItems="flex-start"
          alignSelf="flex-start"
          extend={{
            boxShadow: '0 0 0 2px rgba(0,0,0,0.2)',
            backgroundColor: 'white',
            borderRadius: 8,
          }}>
          <img
            height={150}
            width="auto"
            src={getImageUrl(info.id, info.name)}
          />
        </Box>
        <Box
          as="a"
          paddingLeft={2}
          href=""
          display="none"
          alignItems="center"
          extend={{
            color: 'black',
            '@media (min-width: 1280px)': {
              display: 'flex',
            },
          }}
          onClick={(e) => {
            e.preventDefault()
            addBookmark()
          }}>
          Bookmark
        </Box>
      </Box>
    </Box>
  )
}
