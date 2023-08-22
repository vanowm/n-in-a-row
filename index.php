<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
  <meta name="color-scheme" content="light dark">
  <title>𝒏 in a row</title>
  <link rel="stylesheet" media="screen" href="<?=getfile("css/row.css")?>">
</head>

<body>
  <input id="main-menu" type="checkbox" data-popup="mainMenu">
  <header>
    <nav class="main-menu">
      <label for="main-menu" class="close-overlay" title=""></label>
      <div class="menu popup">
        <header>Options</header>
        <div class="menu-content">
          <div>
            <span>Size:</span>
            <span>
              <select id="size"></select>
            </span>
          </div>
          <div>
            <span></span>
            <span>
              <select id="row"></select> in a row
            </span>
          </div>
          <div>
            <span>Players:</span>
            <span>
              <select id="players"></select>
            </span>
          </div>
          <div>
            <span>Computer players:</span>
            <span>
              <select id="bots"></select>
            </span>
          </div>
          <div>
            <span>
              <button id="resetSettings">Reset</button>
            </span>
          </div>
        </div>
      </div>
      <label for="main-menu" class="menu-icon" title="Menu">
        <span class="navIcon" aria-label="Hamburger menu 'icon'"></span>
      </label>
    </nav>
  </header>
  <main>
    <div class="players"><span></span><span></span><span></span><span></span></div>
    <div id="board"></div>
    <button onclick="init()">reset</button>
  </main>
<footer><div id="avg"></div></footer>
  <script type="text/javascript" src="<?=getfile("js/row.js")?>"></script>
</body>

</html>