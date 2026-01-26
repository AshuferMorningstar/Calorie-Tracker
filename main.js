document.addEventListener('DOMContentLoaded',()=>{
  const splash = document.getElementById('splash')
  const content = document.getElementById('content')

  // Simple timed splash: show for 1.5s then reveal content
  setTimeout(()=>{
    splash.style.transition='opacity 400ms ease'
    splash.style.opacity='0'
    setTimeout(()=>{
      splash.hidden = true
      content.hidden = false
    },420)
  },1500)
})
