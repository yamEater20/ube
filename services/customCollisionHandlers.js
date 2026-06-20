import { ICollisionHandler } from "../engine/iCollisionHandler.js";

export class TagOnly extends ICollisionHandler {
    constructor(tags) {
        super();
        this._tags = tagListIntoDictionary(tags);
    }

    getTags() {
        return this._tags;
    }

    containsTag(tag) {
        return this.getTag(tag) != undefined;
    }

    getTag(tag) {
        return this._tags[tag];
    }


    onCollide() {
        throw new Error("You are calling onCollide from something that's not supposed to be moving.");
    }
}

export class Composite extends TagOnly {
    constructor(tags, reactions) {
        super(tags);
        this._reactions = reactions;
    }

    getReactions() { return this._reactions; }

    onCollide(physObj, others, direction) {
        //Can't call this.getReactions() because decorators do not override.
        //I need to rethink this architecture.
        //TODO: I think composite should contain a TagCollider and a ReactionCollider.
        // - Clearly, we need TagOnly colliders (ie Walls).
        // - But we also need Reaction-only colliders. Example: particles.
        // - More importantly, Compsoite should not inherit from TagOnly. That doesn't make any sense.
        const myReactions = physObj.collisionHandler.getReactions();

        let allColliding = [];
        let stoppedAgainst = [];

        others.forEach(other => {
            const otherTags = other.collisionHandler.getTags();
            const myAllColliding = myReactions
                .map(reaction => {
                    return { tag: otherTags[reaction.id()], "reaction": reaction, other: other };
                })
                .filter(pair => pair.tag);

            allColliding = allColliding.concat(myAllColliding);

            stoppedAgainst = stoppedAgainst.concat(
                myAllColliding.filter(pair => pair.tag.shouldStopMoving(other, physObj, direction))
            );
        });

        if (stoppedAgainst.length === 0) {
            allColliding.forEach(pair => pair.reaction.react(physObj, pair.other, pair.tag, direction));
            return false;
        } else {
            stoppedAgainst.forEach(pair => pair.reaction.react(physObj, pair.other, pair.tag, direction));
            return true;
        }
    }
}

export class IReaction {
    id() { throw new Error("Must implement"); }
    react(physObj, other, ground, direction) { throw new Error("Must implement"); }
}

function tagListIntoDictionary(tags) {
    const ret = {};
    tags.forEach(a => {
        const id = a.id();
        if (ret[id]) {
            throw new Error(`Duplicate Tag Ids for ${tagName(tags, id)}: current ${ret[id]}, new ${a}.\nI can't imagine why you'd want this.`);
        }
        ret[id] = a;
    });
    return ret;
}

export function tagName(tagIds, id) {
    Object.keys(tagIds).find(k => tagIds[k] === id);
}