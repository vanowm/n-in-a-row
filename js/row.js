// jshint -W082,-W014, -W083

{
  "use strict";
  const EL = new Proxy(
        {
          get get()
          {
            return new Proxy({},
            {
              get(target,prop,proxy)
              {
                return document.getElementById(prop) || document.querySelector(prop);
              },
            });
          },
          get all()
          {
            return new Proxy({},
            {
              get(target,prop,proxy)
              {
                return document.querySelectorAll(prop);
              },
            });
          },
          get updateCache()
          {
            const target = this;
            return new Proxy({},
            {
              get(t,prop,proxy)
              {
                return (target[prop] = target.get[prop]);
              },
            });
          },
        },
        {
          get(target, prop, proxy) {
            return prop in target ? target[prop] : (target[prop] = target.get[prop]);
          }
        }),

        SETTINGS = new Proxy(
        {
          size: {default: 7, value: 7, min: 4, max: 100, resetBoard: true},
          row: {default: 4, value: 4, min: 3, max: 100, resetBoard: true},
          players: {default: 2, value: 2, min: 2, max: 4, resetBoard: true},
          bots: {default: 1, value: 1, min: 0, max: 4, resetBoard: true},
          darkMode: {default: 0, value: 0, min: 0, max: 2},
        },
        {
          get(target, prop, proxy)
          {
            if (prop === "init")
              return () => this.init(target);
  
            if (prop == "save")
              return () => this.save(target);
            
            if (prop == "clear")
              return () => this.clear(target);

            if (prop == "toJSON")
            {
              const ret = {};
              for(let i in target)
                ret[i] = target[i].value === undefined ? target[i] : target[i].value;

              return () => ret;
            }
  
            if (["min", "max", "default", "map", "resetBoard"].includes(prop))
            {
              return Object.keys(target).reduce((obj, key) => 
              {
                if ((key == "row" || key == "bots") && prop == "max")
                {
                  target[key][prop] = this.getMax(target, key);
                }
                obj[key] = target[key][prop];
                return obj;
              }, {});
            }
            return target[prop] && (target[prop].value === undefined ? target[prop] : target[prop].value);
          }, //get()
  
          getMax(target, prop)
          {
            if (prop == "bots")
              return (target[prop].max = target.players.value);

            return (target[prop].max = Math.round(target.size.value * 0.7));
          },

          set(target, prop, value, proxy)
          {
            value = this.check(target, prop, value);
            if (value === undefined)
              return;
  
            target[prop].value = value;
            if (target[prop].onChange instanceof Function)
              target[prop].onChange(value);

            if (prop == "size")
            {
              this.getMax(target, "row");
              if (target.row.value > target.row.max)
                this.set(target, "row", target.row.max);
            }
            if (prop == "players")
            {
              this.getMax(target, "bots");
              if (target.bots.value > target.bots.max)
                this.set(target, "bots", target.bots.max);
            }

            return this.save(target);
          }, //set()
  
          init(target, data)
          {
            if (data === undefined)
              data = this.load(target);
  
            for(let i in target)
            {
              let value = this.check(target, i, data[i]),
                  obj = false;

              if (value !== null && value instanceof Object && !(value instanceof Array))
              {
                value = this.init(value, value);
                obj = true;
              }
  
              if (value === undefined)
                value = target[i].default;
  
              if (value === undefined)
                continue;

              if (obj)
                target[i] = value;
              else
              {
                target[i].value = value;
                if (target[i].onChange instanceof Function)
                  target[i].onChange(value);
              }
            }
            return target;
          }, //init()
  
          load(target)
          {
            return JSON.parse(localStorage.getItem("rowSettings")) || {};
          },
  
          clear(target)
          {

            localStorage.removeItem("rowSettings");
            this.init(target);
          },
          save(target)
          {
            return localStorage.setItem("rowSettings",  JSON.stringify(Object.keys(target).reduce((obj, key) =>
            {
              let val = target[key].value;
  // for(let i = 0; i < 256; i++)
  // {
  //   console.log(i.toString(16), JSON.stringify(String.fromCharCode(i)))
  // }
              if (val === undefined)
                val = target[key];
  
              obj[key] = val;
              return obj;
            }, {})));
          }, //save()
  
          check(target, prop, value)
          {
            let res = prop in target && target[prop] !== null && (typeof target[prop].value == typeof value || typeof target[prop] == typeof value);
            if (res && target[prop] instanceof Object && target[prop] !== null && "min" in target[prop] && value < target[prop].min)
              return target[prop].min;
  
            if (res && target[prop] instanceof Object && target[prop] !== null && "max" in target[prop] && value > target[prop].max)
              return target[prop].max;
  
            return res ? value : undefined;
          }
        }); //settings

  SETTINGS.init();
  setTheme();
  setOptions();

  let player = 0;
  //starting with empty arrays;
  let gameBoard = [];
  init();
  
  function init()
  {
    document.body.dataset.player = player;
    delete document.body.dataset.winner;
    const size = SETTINGS.size;
    gameBoard.length = size;
    gameBoard.size = size*size;
    document.body.classList.remove("finished");
    for(let i = 0, bot = SETTINGS.players - SETTINGS.bots, max = SETTINGS.max.players; i < max; i++)
    {
      document.body.classList.toggle("playerBot" + i, i >= bot);
    }
    for(let i = 0; i < size; i++)
    {
      const column = board.children[i] || document.createElement("div");
      column.innerHTML = "";
      gameBoard[i] = [];
      if (column.parentNode)
        continue;
  
      board.appendChild(column);
      column.addEventListener("click", e =>
      {
        const size = SETTINGS.size;
        //check if current column has n items
        if (gameBoard[i].length >= size)
          return;
  
        //add item to the column
        gameBoard[i].push(player);
        const span = document.createElement("span");
        span.className = "player" + player;
        column.appendChild(span);
        const res = count(i);
        let winner = 0;
        gameBoard.size--;
    
        for(let c = 0; c < res.length; c++)
        {
          if (res[c].length >= SETTINGS.row)
          {
            winner++;
            for(let n = 0; n < res[c].length; n++)
            {
              const {col, row} = res[c][n];
              board.children[col].children[row].classList.add("win");
            }
          }
        }
        if (winner)
        {
          gameBoard.forEach(r => r.length = gameBoard.length);
          document.body.dataset.winner = player;
        }
        if (++player >= SETTINGS.players)
          player = 0;

console.log("player", player, SETTINGS.players);
        document.body.dataset.player = player;
        if (winner || !gameBoard.size)
        {
          document.body.classList.add("finished");
        }
        else
          botPlayer();
      });
    }
    while(EL.board.children.length > size)
      EL.board.removeChild(EL.board.lastChild);

    botPlayer();
  }
  function botPlayer()
  {
    if (player < SETTINGS.players - SETTINGS.bots)
      return;
console.log(player, SETTINGS.players - SETTINGS.bots);
    let col, max = gameBoard.length-1;
    do
    {
      col = Math.round(Math.random() * max);
    }
    while(gameBoard[col].length > max);
    setTimeout(() => EL.board.children[col].click(), 0);
  }
  function count(col)
  {
    let row = gameBoard[col].length - 1,
        pos = [ {col, row, colDir:1, rowDir:0, s:2}, /* ew */
                {col, row, colDir:0, rowDir:1, s:2}, /* ns */
                {col, row, colDir:1, rowDir:1, s:2}, /* nesw */
                {col, row, colDir:-1, rowDir:1, s:2} /* nwse */
              ],
        count = [[{col, row}],[{col, row}],[{col, row}],[{col, row}]],
        player = gameBoard[col][row];
  
    for(let i = 0; i < gameBoard.length; i++)
    {
      let next = pos.length;
      for(let d = 0; d < pos.length; d++)
      {
        if (!pos[d].s)
        {
          next--;
          continue;
        }
        let c = pos[d].col += pos[d].colDir;
        let r = pos[d].row += pos[d].rowDir;
        if (!gameBoard[c] || gameBoard[c][r] != player)
        {
          pos[d].s--;
          pos[d].colDir = -pos[d].colDir;
          pos[d].rowDir = -pos[d].rowDir;
          pos[d].col = col;
          pos[d].row = row;
          continue;
        }
        if (gameBoard[c] && gameBoard[c][r] == player)
        {
          count[d].push({col: c, row: r});
        }
      }
      if (!next)
        break;
    }
    return count;
  }

  function setOptions(opts)
  {
    if (opts === undefined)
    {
      opts = SETTINGS.toJSON();
    }
    for(let id in opts)
    {
      const el = EL[id],
            val = opts[id];

      document.body.dataset[id] = ~~val;
      document.body.style.setProperty("--" + id, ~~val);
      if (!el || !el.matches("input,select"))
        continue;

      elInit(el);

    }
  }
  function elInit(el)
  {
    if (el.type == "checkbox")
    {
      el.checked = SETTINGS[el.id];
    }
    else if (el.tagName == "SELECT")
    {
      let option = document.createElement("option");
      let max = SETTINGS.max[el.id],
          min = SETTINGS.min[el.id];
      for(let i = min, n = 0, def = SETTINGS.default[el.id], map = SETTINGS.map[el.id]||[]; i <= max; i++, n++)
      {
        option = el.children[n] || option.cloneNode(true);
        option.textContent = map[i] === undefined ? i : map[i];
        option.value = i;
        option.className = i == def ? "default" : "";
        if (!option.parentNode)
          el.appendChild(option);
      }
      if (!min)
        max++;

      while(el.children.length > 1 && el.children.length > max)
        el.removeChild(el.children[el.children.length-1]);

      el.value = SETTINGS[el.id];
    }
    else
    {
      el.value = SETTINGS[el.id];
      el.min = SETTINGS.min[el.id];
      el.max = SETTINGS.max[el.id];
    }
    if (el.___inited)
      return;

    el.___inited = true;
    let timerInput, timerFilter;
    el.addEventListener("input", e => 
    {
      const isCheckbox = el.type == "checkbox",
            isSelect = el.tagName  == "SELECT";
      let value = isCheckbox ? el.checked : isSelect ? ~~el.value : Math.max(el.min, Math.min( ~~el.value, el.max));
  
      if (!isCheckbox && !isSelect && SETTINGS.resetBoard[el.id]) /* text input */
      {
        clearTimeout(timerFilter);
        if (el.value != value)
        {
          timerFilter = setTimeout(() => (el.value = value, init(true)), 3000);
        }
      }
      SETTINGS[el.id] = value;
      const opts = {};
      opts[el.id] = value;
console.log(el.id);
      setOptions(opts);
      if (isCheckbox)
        return;


      // if (el.id != "mines")
      // {
      //   const max = SETTINGS.width * SETTINGS.height - 1;
      //   EL.mines.max = max;
      //   if (~~EL.mines.value > max)
      //   {
      //     SETTINGS.mines = max;
      //     EL.mines.value = max;
      //   }
      // }
      clearTimeout(timerInput);
      if (SETTINGS.resetBoard[el.id])
      {
        timerInput = setTimeout(() =>
        {
          init(true);
          setOptions();
        }, isSelect ? 0 : 300);
      }
  
    });
  }//elInit()

  function setTheme(theme)
  {
    if (theme === undefined)
      theme = SETTINGS.darkMode;
  
    if (theme == 2)
      document.documentElement.removeAttribute("theme");
    else
      document.documentElement.setAttribute("theme", SETTINGS.darkMode ? "dark" : "light");
  
    SETTINGS.darkMode = theme;
    const style = document.getElementById("dropdownstyle") || document.createElement("style"),
          s = getComputedStyle(document.querySelector("select")),
          css = `label.dropdown{${Array.from(s).map(k =>`${k}:${s[k]}`).join(";")}}`;
  
    style.innerHTML = css;
    style.id = "dropdownstyle";
    document.head.insertBefore(style, document.head.querySelector("[rel='stylesheet']"));
    document.documentElement.style.setProperty("--textColor", getComputedStyle(document.documentElement).color);
  }

  EL.resetSettings.addEventListener("click", e =>
  {
    SETTINGS.clear();
    setOptions();
    init(true);
  });

}
