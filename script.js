(() => {
  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => [...p.querySelectorAll(s)];

  window.addEventListener("load", () => {
    setTimeout(() => $("#loader")?.classList.add("hide"), 550);
  });

  // Cursor light
  const glow = $(".cursor-glow");
  window.addEventListener("pointermove", e => {
    if (glow) { glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px"; }
  }, {passive:true});

  // Mobile nav
  const toggle = $(".menu-toggle"), nav = $(".nav-links");
  toggle?.addEventListener("click", () => nav.classList.toggle("open"));
  $$(".nav-links a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

  // Active navigation
  const sections = $$("main section[id]");
  const navItems = $$(".nav-links a");
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        navItems.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
      }
    });
  }, {rootMargin:"-40% 0px -50% 0px"});
  sections.forEach(s => navObserver.observe(s));

  // Reveal on scroll
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold:.12});
  $$(".reveal").forEach(el => revealObserver.observe(el));

  // Counters
  const counters = $$(".stat strong");
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      const el = entry.target, target = Number(el.dataset.count || 0), suffix = el.dataset.suffix || "+";
      let start = 0, startTime = null;
      const tick = t => {
        if(!startTime) startTime=t;
        const p=Math.min((t-startTime)/1200,1), eased=1-Math.pow(1-p,3);
        el.textContent=Math.floor(eased*target)+(p===1?suffix:"");
        if(p<1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, {threshold:.7});
  counters.forEach(c=>counterObserver.observe(c));

  // 3D tilt
  $$(".tilt").forEach(card => {
    card.addEventListener("pointermove", e => {
      if(matchMedia("(max-width: 700px)").matches) return;
      const r=card.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`perspective(800px) rotateX(${(-y*6).toFixed(2)}deg) rotateY(${(x*7).toFixed(2)}deg) translateZ(5px)`;
    });
    card.addEventListener("pointerleave", () => card.style.transform="");
  });

  // Magnetic buttons
  $$(".magnetic").forEach(btn => {
    btn.addEventListener("pointermove", e => {
      const r=btn.getBoundingClientRect();
      btn.style.transform=`translate(${(e.clientX-(r.left+r.width/2))*.12}px,${(e.clientY-(r.top+r.height/2))*.12}px)`;
    });
    btn.addEventListener("pointerleave",()=>btn.style.transform="");
  });

  // Timeline line
  const timeline = $(".timeline"), line = $(".timeline-line span");
  if(timeline && line){
    const updateLine=()=> {
      const r=timeline.getBoundingClientRect(), h=Math.max(0, Math.min(r.height, window.innerHeight*.72-r.top));
      line.style.height=(h)+"px";
    };
    window.addEventListener("scroll", updateLine, {passive:true}); updateLine();
  }

  // Contact form validation
  const form=$("#contact-form"), status=$(".form-status");
  const fields = [
    [$("#name"), v => v.trim().length >= 2, "Please enter your name."],
    [$("#email"), v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), "Please enter a valid email."],
    [$("#subject"), v => v.trim().length >= 3, "Please enter a subject."],
    [$("#message"), v => v.trim().length >= 15, "Message should be at least 15 characters."]
  ];
  function validateField(input, test, msg){
    const error=input.parentElement.querySelector(".error");
    const ok=test(input.value);
    input.classList.toggle("invalid", !ok); error.textContent=ok?"":msg;
    return ok;
  }
  fields.forEach(([input,test,msg]) => {
    input.addEventListener("input",()=>validateField(input,test,msg));
    input.addEventListener("blur",()=>validateField(input,test,msg));
  });
  form?.addEventListener("submit", e => {
    e.preventDefault();
    const ok=fields.map(([i,t,m])=>validateField(i,t,m)).every(Boolean);
    if(!ok){
      status.textContent="Please fix the highlighted fields and try again.";
      status.className="form-status error-msg"; return;
    }
    status.textContent="Message validated successfully. Please use the social/direct contact options to send your enquiry.";
    status.className="form-status";
    form.reset();
    fields.forEach(([i])=>i.classList.remove("invalid"));
  });

  // Three.js hero scene
  const canvas=$("#hero-canvas");
  if(canvas && window.THREE){
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(42, canvas.clientWidth/canvas.clientHeight, .1, 100);
    camera.position.set(0,0,7);
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
    renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);
    renderer.outputEncoding=THREE.sRGBEncoding;

    const group=new THREE.Group(); scene.add(group);

    const coreGeo=new THREE.IcosahedronGeometry(1.38,2);
    const coreMat=new THREE.MeshPhysicalMaterial({color:0x1e6573,metalness:.8,roughness:.2,transparent:true,opacity:.78,wireframe:true});
    const core=new THREE.Mesh(coreGeo,coreMat); group.add(core);

    const innerGeo=new THREE.IcosahedronGeometry(.92,2);
    const innerMat=new THREE.MeshBasicMaterial({color:0x8df7ff,wireframe:true,transparent:true,opacity:.16});
    group.add(new THREE.Mesh(innerGeo,innerMat));

    const torusMat=new THREE.MeshBasicMaterial({color:0x70eaf4,transparent:true,opacity:.48});
    [2.0,2.35,2.72].forEach((r,i)=>{
      const t=new THREE.Mesh(new THREE.TorusGeometry(r,.008,8,160),torusMat);
      t.rotation.x=.8+i*.4; t.rotation.y=i*.7; group.add(t);
    });

    const particlesGeo=new THREE.BufferGeometry();
    const count=850, pos=new Float32Array(count*3);
    for(let i=0;i<count*3;i++) pos[i]=(Math.random()-.5)*12;
    particlesGeo.setAttribute("position",new THREE.BufferAttribute(pos,3));
    const particles=new THREE.Points(particlesGeo,new THREE.PointsMaterial({color:0x8ceff6,size:.012,transparent:true,opacity:.7}));
    scene.add(particles);

    const light=new THREE.PointLight(0x77eff7,2.5,8); light.position.set(2,2,3); scene.add(light);
    scene.add(new THREE.AmbientLight(0x26364e,1.3));

    let tx=0,ty=0, mx=0,my=0;
    window.addEventListener("pointermove",e=>{
      mx=(e.clientX/innerWidth-.5); my=(e.clientY/innerHeight-.5);
      tx=mx*.45; ty=my*.28;
    },{passive:true});
    const resize=()=>{
      const w=canvas.clientWidth,h=canvas.clientHeight;
      if(w&&h){camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
    };
    window.addEventListener("resize",resize); resize();

    const clock=new THREE.Clock();
    function animate(){
      requestAnimationFrame(animate);
      const t=clock.getElapsedTime();
      group.rotation.y += .0025;
      group.rotation.x += .001;
      group.position.x += (tx-group.position.x)*.025;
      group.position.y += (-ty-group.position.y)*.025;
      core.rotation.x=t*.12; core.rotation.z=t*.09;
      particles.rotation.y=t*.015;
      renderer.render(scene,camera);
    }
    animate();
  }
})();