/**
 * Print room description on each enter
 * @param {Object} room 
 */
const descOnEnter = room => {
  const existingOnEnter = room.onEnter;
  room.onEnter = () => {
    if (room.visits > 1) {
      println(room.desc)
    }
    if(existingOnEnter) {
      existingOnEnter()
    }
  }
  return room
}

const zeroToN = (n) => {
	return Array(n).fill(0).map((_, i) => i);
}

const initEnum = (states, prefix) => {
	return Object.fromEntries(states.map(s => (prefix ? [prefix, s] : [s]).join('_').toUpperCase()).map(n => [n,n]))
}
const LandState = initEnum(['UNTILLED','UNWATERED', 'WATERED'])

const printLandStats = (landData) => {
	const plots = landData?.plots ?? []
	const untilledPlots = plots.filter(p => p.state === LandState.UNTILLED)
	const unwateredPlots = plots.filter(p => p.state === LandState.UNWATERED)
	const unwateredPlanted = Object.groupBy(unwateredPlots.filter(p=>p.item), p => p.item.name)
	const wateredPlots = plots.filter(p => p.state === LandState.WATERED)
	const wateredPlanted = Object.groupBy(wateredPlots.filter(p=>p.item), p => p.item.name)

	const total = plots.length
	println(`${bullet} Untilled: ${untilledPlots.length}/${total}`)
	println(`${bullet} Unwatered: ${unwateredPlots.length}/${total}`)
	if(Object.keys(unwateredPlanted).length) {
		Object.entries(unwateredPlanted).forEach(([seedName, seedPlots]) => println(`  ${bullet} ${seedName}: ${seedPlots}`))
	}
	println(`${bullet} Watered: ${wateredPlots.length}/${total}`)
	if(Object.keys(wateredPlanted).length) {
		Object.entries(wateredPlanted).forEach(([seedName, seedPlots]) => println(`  ${bullet} ${seedName}: ${seedPlots}`))
	}
}

Object.assign(commands[0], {stats: () => println(`Usage: stats land`)})
Object.assign(commands[1], {stats: (arg) => commands[2].stats([arg])})
Object.assign(commands[2], {stats: (args) => {
	const stat = args[0]
	if(stat === 'land') {
		printLandStats(getRoom(disk.roomId).land)
	} else {
		println(`I'm not sure what you mean by the stat "${stat}"`)
	}
}})

const farmLifeDisk = () => ({
  roomId: 'farmhouse',
  rooms: [
    {
      id: 'farmhouse',
      name: 'The Farmhouse',
      desc: `Your farmhouse is simple but at least it has a bed to sleep in and fireplace to keep warm by. You can go OUTSIDE using the front door.`, // Displayed when the player first enters the room.
      items: [
	{
		name: ['front door', 'door'],
		desc: `The door to the farm`,
		isTakeable: false,
		onUse: () => {
			goDir('outside')
		},
		
	},
      {
      	name: 'bed',
      	desc: 'Rejuvinate your energy and feel refreshed by morning!',
      	onUse: () => {
      		println(`You go to sleep. zzzzz`)
      	},
      	isTakeable: false
      },
      {
      	name: 'watch',
      	desc: `A smartwatch that tells the time and monitors your body's energy level.`,
      	isTakeable: true,
      	time: 6 * 60 * 60, // 6AM in seconds
      	energy: 96,
  		maxEnergy: 100,
      	onUse: () => {
      		const watch = getItemInInventory('watch') 
      		if(!watch) {
      			println(`You must have the watch in your inventory to use it!`)
      			return
      		}
      		const hours = Math.floor((watch.time / (60 * 60)) % 24)
      		const minutes = Math.floor((watch.time / (60)) % 60)
      		const seconds = Math.floor((watch.time % 60))
      		println(`Time: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
      		println(`Energy: ${watch.energy}/${watch.maxEnergy}`)
      		
      	}
      },
      {
      	name: ['pickaxe'],
      	desc: `Used to break rocks.`,
      	isTakeable: true
      },
      {
      	name: ['hoe'],
      	desc: `Used to till the earth.`,
      	isTakeable: true,
      	onUse: () => {
      		// TODO figure out best way to prevent user from using item they do not have
      		if(!getItemInInventory('hoe')) {
      			println(`You must have a hoe in your inventory to use it!`)
      			return
      		}
      		const room = getRoom(disk.roomId)
      		println(disk.roomId)
      		// TODO find a better way to convey the land plots
			const plots = room?.land?.plots ?? []
      		if(plots.length) {
      			const untilledPlots = plots.filter(p => p.state === LandState.UNTILLED)
      			if(untilledPlots.length){
      				untilledPlots.forEach(p => {p.state = LandState.UNWATERED })
      				println(`You till ${untilledPlots.length} plots of land`)
      			}else {
  					println(`Looks like you've done all your tillin'.`)
      			}
      		} else {
      			println(`There is nothing here to use your hoe on.`)
      		}
      		printLandStats(room?.land)
      	}
      },
      {
      	name: ['axe'],
      	desc: `Used to chop down trees.`,
      	isTakeable: true
      },
      {
      	name: ['parsnip seeds'],
      	desc: `These seeds take 4 days to grow.`,
      	isTakeable: true,
      	count: 1,
      },
      
      /*
        {
          name: 'door',
          desc: 'It leads SOUTH.', // Displayed when the player looks at the item.
          onUse: () => println(`Type GO SOUTH to try the door.`), // Called when the player uses the item.
        },
        {
          name: ['vines', 'vine'], // The player can refer to this item by either name. The game will use the first name.
          desc: `They grew over the DOOR, blocking it from being opened.`,
        },
        {
          name: 'axe',
          desc: `You could probably USE it to cut the VINES, unblocking the door.`,
          isTakeable: true, // Allows the player to take the item.
          onUse() {
            // Remove the block on the room's only exit.
            const room = getRoom('start');
            const exit = getExit('north', room.exits);

            if (exit.block) {
              delete exit.block;
              println(`You cut through the vines, unblocking the door to the NORTH.`);

              // Update the axe's description.
              getItem('axe').desc = `You USED it to cut the VINES, unblocking the door.`;
            } else {
              println(`There is nothing to use the axe on.`);
            }
          },
        }
        */
      ],
      exits: [
        {
          dir: 'outside', // "dir" can be anything. If it's north, the player will type "go north" to get to the room called "A Forest Clearing".
          id: 'farm',
          //block: `The DOOR leading NORTH is overgrown with VINES.`, // If an exit has a block, the player will not be able to go that direction until the block is removed.
        },
      ],
    },
    {
      id: 'farm',
      name: 'The Farm',
      desc: `It's a barren expanse of land, ready to be tilled and farmed. To the NORTH you can go INSIDE your farmhouse. To the EAST is a road that leads to town. To the WEST is a grassy pasture. To the SOUTH is a thicket of woods`,
      land: {
      	plots: zeroToN(100).map((i) => ({
	   			state: LandState.UNTILLED,
      	     	item: undefined,
    	     }))
      },
      onEnter: () => {
      	const room = getRoom(disk.roomId)
      	// const plots = getItemInRoom
      	// if(room.visits > 1) {
      	// 	println(room.desc)
      	// }
      },
      items: [
      ],
      exits: [
        {
          dir: 'north',
          id: 'farmhouse',
        },
        {
          dir: 'inside',
          id: 'farmhouse',
        },
        {
          dir: 'east',
          id: 'town',
        },
        {
        	dir: 'south',
        	id: 'woods'
        },
        {
        	dir: 'west',
        	id: 'pasture'
        }
      ],
    },
    {
    	id: 'woods',
    	name: 'Woods',
    	desc: `An overgrown tangle of trees, tall grasses and rocks fill your view. Can't even walk through it, much less see through it! To the NORTH is the rest of your farm`,
    	exits: [
    		{
    			dir: 'north',
    			id: 'farm'
    		},
    	]
    },
    {
    	id: 'pasture',
    	name: 'Pasture',
    	desc: `Not much besides some grass, but it looks like it has potential. To the EAST is the rest of your farm`,
    	exits: [
    		{
    			dir: 'east',
    			id: 'farm'
    		}
    	]
    },
	{
        id: 'town',
        name: 'Town',
        desc: `You see all kinds of shops and even some houses too. To the WEST is the road back to your farm`,
        exits: [
            {                                                       dir: 'west',
                id: 'farm'                                      }
        ]
    }
  ].map(descOnEnter),
});
