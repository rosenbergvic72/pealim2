import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Audio } from 'expo-av';

// Each new request cancels the previous one, including a createAsync still in flight.
export default function useSentenceAudio() {
  const serial=useRef(0),current=useRef(null),pending=useRef(null),alive=useRef(true);
  const unload=async sound=>{ if(sound) { try { sound.setOnPlaybackStatusUpdate(null); await sound.unloadAsync(); } catch {} } };
  const stop=useCallback(()=>{
    serial.current+=1;
    if(pending.current) { pending.current(false); pending.current=null; }
    const sound=current.current;current.current=null;void unload(sound);
  },[]);
  const play=useCallback(async (source, timeout=30000)=>{
    stop();if(!source || !alive.current) return false;
    const token=serial.current;
    return new Promise(resolve=>{
      let settled=false,sound=null;
      const finish=ok=>{
        if(settled) return;settled=true;clearTimeout(timer);
        if(pending.current===finish) pending.current=null;
        if(current.current===sound) current.current=null;
        void unload(sound);resolve(ok);
      };
      const timer=setTimeout(()=>finish(false),timeout);
      pending.current=finish;
      (async()=>{
        try {
          await Audio.setAudioModeAsync({playsInSilentModeIOS:true,staysActiveInBackground:false,shouldDuckAndroid:true});
          if(settled || token!==serial.current || !alive.current) return finish(false);
          const created=await Audio.Sound.createAsync(source,{shouldPlay:false});sound=created.sound;
          if(settled || token!==serial.current || !alive.current) {void unload(sound);return finish(false);}
          current.current=sound;
          sound.setOnPlaybackStatusUpdate(status=>{
            if(status.error) finish(false);
            else if(status.isLoaded && status.didJustFinish) finish(true);
          });
          await sound.playAsync();
        } catch { finish(false); }
      })();
    });
  },[stop]);
  useEffect(()=>{
    alive.current=true;
    const sub=AppState.addEventListener('change',state=>{if(state!=='active')stop();});
    return()=>{alive.current=false;sub.remove();stop();};
  },[stop]);
  return {play,stop};
}
