import {inflateSync,deflateSync} from 'node:zlib'
import {readFileSync,writeFileSync} from 'node:fs'
export function readPng(path){
 const b=readFileSync(path);if(b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Expected PNG: '+path)
 const width=b.readUInt32BE(16),height=b.readUInt32BE(20),channels=b[25]===6?4:b[25]===2?3:0
 if(b[24]!==8||!channels||b[28]!==0)throw Error('Expected noninterlaced RGB/RGBA8: '+path)
 const chunks=[];for(let i=8;i<b.length;){const n=b.readUInt32BE(i),type=b.toString('ascii',i+4,i+8);if(type==='IDAT')chunks.push(b.subarray(i+8,i+8+n));i+=12+n}
 const raw=inflateSync(Buffer.concat(chunks)),stride=width*channels,decoded=Buffer.alloc(stride*height)
 const paeth=(a,c,d)=>{const p=a+c-d,x=Math.abs(p-a),y=Math.abs(p-c),z=Math.abs(p-d);return x<=y&&x<=z?a:y<=z?c:d}
 for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];for(let x=0;x<stride;x++){const a=x>=channels?decoded[y*stride+x-channels]:0,c=y?decoded[(y-1)*stride+x]:0,d=y&&x>=channels?decoded[(y-1)*stride+x-channels]:0;decoded[y*stride+x]=(raw[y*(stride+1)+x+1]+(filter===0?0:filter===1?a:filter===2?c:filter===3?Math.floor((a+c)/2):filter===4?paeth(a,c,d):(()=>{throw Error('PNG filter')})()))&255}}
 const data=Buffer.alloc(width*height*4);for(let i=0;i<width*height;i++){data[i*4]=decoded[i*channels];data[i*4+1]=decoded[i*channels+1];data[i*4+2]=decoded[i*channels+2];data[i*4+3]=channels===4?decoded[i*channels+3]:255}
 return {width,height,data,channels}
}
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0})
function chunk(type,data){const name=Buffer.from(type),body=Buffer.concat([name,data]),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);body.copy(out,4);let crc=0xffffffff;for(const b of body)crc=crcTable[(crc^b)&255]^(crc>>>8);out.writeUInt32BE((crc^0xffffffff)>>>0,out.length-4);return out}
export function writePng(path,image){const {width,height,data}=image,header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const rows=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++)data.copy(rows,y*(width*4+1)+1,y*width*4,(y+1)*width*4);writeFileSync(path,Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('sRGB',Buffer.from([0])),chunk('IDAT',deflateSync(rows,{level:9})),chunk('IEND',Buffer.alloc(0))]))}
export function crop(image,x,y,width,height){const data=Buffer.alloc(width*height*4);for(let row=0;row<height;row++)image.data.copy(data,row*width*4,((row+y)*image.width+x)*4,((row+y)*image.width+x+width)*4);return {width,height,data}}
export function alphaBounds(image,threshold=8){let left=image.width,top=image.height,right=-1,bottom=-1,transparent=0,partial=0;for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){const a=image.data[(y*image.width+x)*4+3];if(a===0)transparent++;else if(a<255)partial++;if(a>=threshold){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}}return {left,top,right,bottom,transparent,partial}}
