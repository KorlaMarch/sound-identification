#include <iostream>
#include "include/sndfile.h"
#include "conio.h"

using namespace std;

void printInfo(SF_INFO info){
    printf("Frames : %d\n",info.frames);
    printf("Samplerate : %d\n",info.samplerate);
    printf("Channels : %d\n",info.channels);
    printf("Format : %#08x\n",info.format);
    printf("Sections : %d\n",info.sections);
    printf("Seekable : %d\n",info.seekable);
}

short data[2048];
short out[2048];
int readcount;

void mergeChannels(short* data, short* out, int datacount, int channels){
    int i,j;
    int sum;
    for(i = 0; i < datacount; i += channels){
        for(j = 0, sum = 0; j < channels; j++){
            sum += data[i+j];
        }
        out[i/channels] = sum/channels;
    }
}

void fft(short* input, ){

}

int main()
{
    SF_INFO info,infoout;
    SNDFILE* inwav = sf_open("test.wav",SFM_READ,&info);
    infoout = info;
    infoout.channels = 1;
    SNDFILE* outwav = sf_open("out.wav",SFM_WRITE,&infoout);
    if(!inwav){
        cout << "Unable to open input file\n";
        sf_perror(NULL);
        return 1;
    }
    if(!outwav){
        cout << "Unable to open output file\n";
        sf_perror(NULL);
        return 1;
    }
    printInfo(info);

    while((readcount = sf_read_short(inwav,data,1024))){
        mergeChannels(data,out,readcount,info.channels);
        sf_write_short(outwav,out,1024/info.channels);
    }


    sf_close(inwav);
    sf_close(outwav);
    return 0;
}
