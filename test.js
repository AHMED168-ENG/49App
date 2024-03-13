
import { executeFFMPEG, getPublicIPAddress } from './helper.js'
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process'
import fs from 'fs'
import download from 'download';
import { amanPayout, bankCardPayout, getPayoutToken, walletPayout } from './controllers/paymob_controller.js';

async function test() {

    /*console.log('start')
    const path = uuidv4() + '.mkv'
    await executeFFMPEG(`-loop 1 -i 3.png -i https://49-space.fra1.digitaloceanspaces.com/main/b6b2f958-42ae-48da-a1fd-8829a8da30a0.mp3 -shortest -acodec copy -vcodec mjpeg public/${path}`)
    console.log(path)*/

    //const result = await executeFFMPEG(`-y -i ./public/files/video.mkv -i ./public/files/logo.png -filter_complex "overlay=x=main_w-overlay_w-(main_w*0.01):y=main_h-overlay_h-(main_h*0.01)" ./public/files/output.mkv`)

    //const result = await executeFFMPEG(`-y -i ./public/files/video.mkv -i ./public/files/logo.png -filter_complex overlay=x=main_w-overlay_w-(main_w*0.01):y=main_h-overlay_h-(main_h*0.01) ./public/files/output.mkv`)

    /*const cmd = `-i ./public/files/sample.mp3 -v quiet -show_entries format=duration -hide_banner -of default=noprint_wrappers=1:nokey=1`
    const result = await executeFFMPEG('ffprobe', cmd)
    console.log(result)
    console.log(parseFloat(result[1]))*/
    //console.log(await getPublicIPAddress())

    // const videoPath = `./public/files/${uuidv4() + uuidv4()}.jpg`
    // const result = fs.writeFileSync(videoPath, await download('https://vid.alarabiya.net/images/2021/02/19/0f58e977-f1de-47df-bed5-37adeb733423/0f58e977-f1de-47df-bed5-37adeb733423_16x9_1200x676.jpg'))
    // console.log(result)

    /*getPayoutToken().then(token => {

        walletPayout(token, 10, 'vodafone', '01023456789').then(r => {
            console.log(r)
        })
    })*/

    /* getPayoutToken().then(token => {
 
         amanPayout(token, 10, '01023456789', "Tom", "Bernardo", "tom.bernardo@gmail.com").then(r => {
             console.log(r)
         })
     })*/

    /*getPayoutToken().then(token => {

        bankCardPayout(token, 10, 'Sherif Sobhy', "EG829299835722904511873050307", "MISR").then(r => {
            console.log(r)
        })
    })*/

    console.log(``)
}
test()