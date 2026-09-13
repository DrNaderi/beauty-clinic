window.addEventListener("scroll",()=>{

document.querySelectorAll(".card,.photo")
.forEach(item=>{

let pos=item.getBoundingClientRect().top;

if(pos < window.innerHeight-100){

item.style.opacity="1";

}

});

});