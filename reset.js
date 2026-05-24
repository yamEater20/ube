export class ResetAtSpawn {
	constructor(entity, relativeSpawnPosition) {
		this._entity = entity;
		this._relativeSpawnPosition = relativeSpawnPosition;
	}

	reset() {
		this._entity.relativePosition = this._relativeSpawnPosition;
	}
}

/*
How am I going to do this LOL

# Methods

1. Pass "reset services" into a global reset pool
    - Each reset service contains references to its type
    - Reset service contains one function to manipulate an entity's data
    - Saves memory by having singletons for each one
    - BUT you can't actually manipulate private fields.

2. Pass scoped reset services into the reset pool
    - Why would you do this
    - What were they thinking


3. Reset method in PhysObj
    - I think this actually might be best
    - BUT you'll have to reset every component too.
    - You're going to have to find all entities/components that stateful.
        - Really, any stateful component is resettable...
        - Hm.
    - You'll have to remember to load the entity into the resettable pool.
    - Honestly I gotta figure out pooling later.
    - Winner winner...

*/

