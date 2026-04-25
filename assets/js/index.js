(function(){
  // Header state
  var header = document.getElementById('siteHeader');
  var onScroll = function(){
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  // Reveal on intersect
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e, i){
        if (e.isIntersecting){
          // stagger siblings
          var delay = 0;
          var parent = e.target.parentElement;
          var staggerParents = ['worry-list','caps-list','reasons-list','flow-list','faq-list'];
          var isStagger = parent && staggerParents.some(function(c){ return parent.classList.contains(c); });
          if (isStagger){
            var siblings = Array.prototype.slice.call(parent.children);
            delay = siblings.indexOf(e.target) * 90;
          }
          setTimeout(function(){
            e.target.classList.add('is-in');
          }, delay);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('is-in'); });
  }
})();