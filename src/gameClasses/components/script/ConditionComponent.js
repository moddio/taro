var ConditionComponent = IgeEntity.extend({
  classId: 'ConditionComponent',
  componentId: 'condition',
  
  init: function (entity, options) {
    var self = this;
  },

  run: function(items, vars)
  {
    if (items == undefined || items.length <= 0)
    {
      return true;
    }

    const [opObj, left, right] = items

    var op = opObj.operator
      
    
    var leftVar = ige.variable.getValue(left, vars)
    var rightVar = ige.variable.getValue(right, vars)
    
    // if the operands are igeEntities, then compare their id's
    if (leftVar && leftVar._id != undefined && rightVar && rightVar._id != undefined)
    {
      leftVar = leftVar._id
      rightVar = rightVar._id
    }

    // ige.script.scriptLog("condition comparing two variables: "+JSON.stringify(left)+op+JSON.stringify(right)+"\n")
    // ige.script.scriptLog("condition comparing: "+ leftVar+" "+ op +" " + rightVar+'\n')  
    
    if (op == 'AND')
    {
      return this.run(left, vars) && this.run(right, vars)
    }
    else if (op == 'OR')
    {
      return this.run(left, vars) || this.run(right, vars)
    }
    else if (op == '==')
    {
      if(rightVar == undefined)
      {
        rightVar = !!rightVar;
      }
      if(leftVar == undefined)
      {
        leftVar = !!leftVar;
      }
      if (typeof leftVar != 'object')
      {
        var leftVar = JSON.stringify(leftVar)  
      }
      
      if (typeof rightVar != 'object')
      {
        var rightVar = JSON.stringify(rightVar)  
      }
      
      return leftVar == rightVar // stringify is important for comparisons like region comparison
    }
    else if (op == '!=')
    {
      return leftVar != rightVar
    }
    else if (op == '<')
    {
      return leftVar < rightVar
    }
    else if (op == '>')
    {
      return leftVar > rightVar
    }
    else if (op == '<=')
    {
      return leftVar <= rightVar
    }
    else if (op == '>=')
    {
      return leftVar >= rightVar
    }
    
  }
});


if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = ConditionComponent; }