// Crash.onCollision callback format
const listener = function(a, b, res, cancel) {
    if (a.data.entity.body.type != 'dynamic') return;

    // this should be the first check because of projectiles
    // in the background
    if (b.data.entity.body.type == 'static') {
        //
        switch(a.data.entity._category) {
            //
            // this priority order is subject to change
            case ('projectile'):
                return projectileHitsStatic();
            case ('unit'):
                return unitHitsStatic();
            case ('item'):
                return itemHitsStatic();
            default:
                return;
        }
    }
    // for now this should only contain dynamic-dynamic collisions
    else {
        //
        switch(a.data.entity._category) {
            //
            // this priority order is subject to change
            case ('projectile'):
                return projectileHitsDynamic();
            case('unit'):
                return unitHitsDynamic();
            case('item'):
                return itemHitsDynamic();
            default:
                return;
        }
    }
}

const projectileHitsStatic = function() {
    //
    switch(b.data.entity._category) {
        //
        case ('unit'):
            //resolution
            a.pos = a.sat.pos = a.sat.pos.sub(res.overlapV);
            a.data.entity._translate.x = a.pos.x;
            a.data.entity._translate.y = a.pos.y;

            a.data.entity._velocity.x -= a.data.entity._velocity.x * 2;
            a.data.entity._velocity.y -= a.data.entity._velocity.y * 2;
            
            return;
            //
        case ('wall'):
            //resolution
            a.pos = a.sat.pos = a.sat.pos.sub(res.overlapV);
            a.data.entity._translate.x = a.pos.x;
            a.data.entity._translate.y = a.pos.y;

            a.data.entity._velocity.x -= a.data.entity._velocity.x * 2;
            a.data.entity._velocity.y -= a.data.entity._velocity.y * 2;
            
            return;
            //
    }
}

const unitHitsStatic = function() {
    //
    switch(b.data.entity._category) {
        //
        case ('unit'):
            //resolution
            a.pos = a.sat.pos = a.sat.pos.sub(res.overlapV);
            a.data.entity._translate.x = a.pos.x;
            a.data.entity._translate.y = a.pos.y;

            a.data.entity._velocity.x = 0;
            a.data.entity._velocity.y = 0;
            
            return;
            //
        case ('wall'):
            //resolution
            a.pos = a.sat.pos = a.sat.pos.sub(res.overlapV);
            a.data.entity._translate.x = a.pos.x;
            a.data.entity._translate.y = a.pos.y;

            a.data.entity._velocity.x = 0;
            a.data.entity._velocity.y = 0;
            
            return;
            //
    }
}

const itemHitsStatic = function() {
    //
    switch(b.data.entity._category) {
        //
        case ('unit'):
            //resolution
        case ('wall'):
            //resolution
    }
}

const projectileHitsDynamic = function() {
    //
    switch(b.data.entity._category) {
        //
        case ('unit'):
            //resolution
            const halfOverlapVB = res.overlapV.clone().scale(0.5);
            const halfOverlapVA = halfOverlapVB.clone().reverse();

            const appliedAngle = Math.atan2(res.overlapN.y, res.overlapN.x);

            if ((Math.PI * 2) % Math.abs(appliedAngle) !== 0) {
                //
                a.data.entity.translateTo(a.pos.x + halfOverlapVA.x, a.pos.y + halfOverlapVA.y);
                b.data.entity.translateTo(b.pos.x + halfOverlapVB.x, b.pos.y + halfOverlapVB.y);
                b.data.entity.rotateTo(0, 0, -(Math.atan2(res.overlapN.y, res.overlapN.x) + (Math.PI / 2)));
                // console.log('Applying angle to... ', b.data.igeId, round(Math.atan2(res.overlapN.y, res.overlapN.x) + (Math.PI / 2)), '\n');
            }

            b.data.entity._velocity.x += a.data.entity._velocity.x/2;
            b.data.entity._velocity.y += a.data.entity._velocity.y/2;

            a.data.entity._velocity.x -= a.data.entity._velocity.x * 2;
            a.data.entity._velocity.y -= a.data.entity._velocity.y * 2;
            
            return;
            //
        case ('projectile'):
            //resolution
        case ('item'):
            //resolution
    }
}

const unitHitsDynamic = function() {
    //
    switch(b.data.entity._category) {
        //
        case ('unit'):
            //resolution
            const halfOverlapVB = res.overlapV.clone().scale(0.5);
            const halfOverlapVA = halfOverlapVB.clone().reverse();

            const appliedAngle = Math.atan2(res.overlapN.y, res.overlapN.x);

            if ((Math.PI * 2) % Math.abs(appliedAngle) !== 0) {
                //
                a.data.entity.translateTo(a.pos.x + halfOverlapVA.x, a.pos.y + halfOverlapVA.y);
                b.data.entity.translateTo(b.pos.x + halfOverlapVB.x, b.pos.y + halfOverlapVB.y);
                b.data.entity.rotateTo(0, 0, -(Math.atan2(res.overlapN.y, res.overlapN.x) + (Math.PI / 2)));
                // console.log('Applying angle to... ', b.data.igeId, round(Math.atan2(res.overlapN.y, res.overlapN.x) + (Math.PI / 2)), '\n');
            }

            b.data.entity._velocity.x += a.data.entity._velocity.x/2;
            b.data.entity._velocity.y += a.data.entity._velocity.y/2;
            // this neds to change
            a.data.entity._velocity.x = 0;
            a.data.entity._velocity.y = 0;
            
            return;
            //
        case ('projectile'):
            //resolution
            return;

        case ('item'):
            //resolution
    }
}

const itemHitsDynamic = function() {
    //
    switch(b.data.entity._category) {
        //
        case ('unit'):
            //resolution
        case ('projectile'):
            //resolution
        case ('item'):
            //resolution
    }
}