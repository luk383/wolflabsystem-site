/* Android host adapter. Shared UI may use these explicitly, normal browser retains fallback. */
(function(){
 const cap=window.Capacitor;
 if(!cap||!cap.isNativePlatform||!cap.isNativePlatform())return;
 const invoke=(method,args)=>cap.nativePromise('WolfDocuments',method,args||{});
 window.WolfNative=Object.freeze({
  exportText:({text,filename,mime})=>invoke('exportText',{text,filename,mime}),
  importText:()=>invoke('importText'),
  printPage:()=>invoke('printPage')
 });
 window.print=()=>window.WolfNative.printPage().catch(()=>window.alert('Stampa non disponibile su questo dispositivo.'));
})();document.addEventListener('click',function(event){
 const anchor=event.target.closest&&event.target.closest('a[href]');
 if(anchor&&window.WolfHasUnsavedWorkout&&!window.confirm('Uscendo puoi perdere la seduta non salvata. Uscire comunque?'))event.preventDefault();
},true);