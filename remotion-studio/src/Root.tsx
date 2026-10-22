import { Composition } from 'remotion';
import { Prueba } from './pieces/prueba/Prueba';
import { Lavado } from './pieces/lavado/Lavado';
import { FPS, H, TOTAL, W } from './pieces/lavado/timeline';

// Registro de piezas: cada pieza nueva va en src/pieces/<nombre>/ y se añade aquí.
export const RemotionRoot = () => (
  <>
    <Composition id="prueba" component={Prueba} durationInFrames={60} fps={30} width={1920} height={1080} />
    <Composition id="lavado" component={Lavado} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
  </>
);
