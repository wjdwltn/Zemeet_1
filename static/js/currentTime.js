function clock(){
    let date = new Date();
    let currentTime = date.toLocaleString([],{
      hourCycle: 'h23',
      hour: '2-digit',
      minute: '2-digit',
    })
    $(".currentTime").html(currentTime)
  }
  function init(){
    setInterval(clock, 1000);
  }
  init();