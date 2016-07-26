#include "iostream"
#include "include/sndfile.h"
#include "conio.h"
#include "math.h"
#include "stdio.h"
#include "complex"
#include "vector"

#define M_PI 3.14159265358979323846
#define EPSI 0.1
#define BUFFER (1<<16)
typedef std::complex<double> comdouble;

void printInfo(SF_INFO info){
    printf("Frames : %d\n",info.frames);
    printf("Samplerate : %d\n",info.samplerate);
    printf("Channels : %d\n",info.channels);
    printf("Format : %#08x\n",info.format);
    printf("Sections : %d\n",info.sections);
    printf("Seekable : %d\n",info.seekable);
}

short input[BUFFER];
short data[BUFFER];
comdouble inCom[BUFFER];
comdouble outCom[BUFFER];

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

void fft(comdouble* in, comdouble* out, int N, int s){
    const double pi2 = M_PI*2.0;
    if(N==1){
        out[0] = in[0];
    }else{
        fft(in,out,N/2,2*s);
        fft(in+s,out+N/2,N/2,2*s);
        for(int k = 0; k < N/2; k++){
            comdouble t = out[k];
            comdouble twfac = exp(-pi2*k/N * comdouble(0, 1) )*out[k+N/2];
            out[k] = t+twfac;
            out[k+N/2] = t-twfac;
        }
    }
}

void hannWindowing(short* input, short* output, int N){
    for(int i = 0; i < N; i++){
        output[i] = input[i]*0.5*(1-cos(2.0*M_PI*i/(N-1)));
    }
}

void writeCSV(FILE* file, comdouble* input, int N, double scaleX){
    fprintf(file,"%.4f\n",scaleX);
    for(int i = 0; i < N; i++){
        fprintf(file,"%.4f\n",std::abs(input[i]) );
    }
}

int main(int argc, char* argv[])
{
    if(argc<3){
        printf("Error Need two arg\n");
        return -1;
    }else printf("GET %d : %s %s\n",argc,argv[1],argv[2]);
    int readcount;
    SF_INFO info;
    SNDFILE* inwav = sf_open(argv[1],SFM_READ,&info);
    FILE* csv;
    if(!inwav){
        std::cout << "Unable to open input file\n";
        sf_perror(NULL);
        return 1;
    }
    printInfo(info);

    //skip to the middle of sound
    sf_seek(inwav,(info.frames-BUFFER)/2,SEEK_SET);

    if((readcount = sf_read_short(inwav,input,BUFFER))){
        mergeChannels(input,data,readcount,info.channels);
        hannWindowing(data,data,readcount);
        for(int i = 0; i < readcount; i++){
            outCom[i] = comdouble( 0.0, 0.0 );
            inCom[i] = comdouble( data[i], 0.0 );
        }
        fft(inCom,outCom,readcount,1);
        //do inverse
        const double inv = 1.0/readcount;
        for(int i = 0; i < readcount; i++){
            outCom[i] *= inv;
        }
        printf("FFT Finish..\n");

        //scale to Hz
        double scale = info.samplerate/(double)readcount;
        csv = fopen(argv[2],"w+");
        writeCSV(csv,outCom,readcount,scale);
        fclose(csv);
    }

    sf_close(inwav);
    return 0;
}
