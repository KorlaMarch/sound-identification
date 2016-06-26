#include "iostream"
#include "include/sndfile.h"
#include "conio.h"
#include "math.h"
#include "stdio.h"

#define M_PI 3.14159265358979323846
#define BUFFER 32768
struct Complex{
    double real,imag;
    Complex(double _real = 0.0, double _imag = 0.0){
        real = _real;
        imag = _imag;
    }
    Complex& operator+=(const Complex& a){
        this->real += a.real;
        this->imag += a.imag;
        return *this;
    }
    Complex operator-(const Complex& a){
        Complex tmp;
        tmp.real = this->real-a.real;
        tmp.imag = this->imag-a.imag;
        return tmp;
    }
};

void printInfo(SF_INFO info){
    printf("Frames : %d\n",info.frames);
    printf("Samplerate : %d\n",info.samplerate);
    printf("Channels : %d\n",info.channels);
    printf("Format : %#08x\n",info.format);
    printf("Sections : %d\n",info.sections);
    printf("Seekable : %d\n",info.seekable);
}

short data[BUFFER];
short out[BUFFER] = {1, -1, 1, -1, 1, -1};
Complex inCom[BUFFER];
Complex outCom[BUFFER];
Complex outCom2[BUFFER];

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

void dft(Complex* input, Complex* output, int N){
    double pi2 = M_PI*2.0;
    double a,cosA,sinA,inv=1.0/N;
    int i,j;
    for(i = 0; i < N; i++){
        if(i%100==0) printf("%d/%d\n",i,N);
        output[i].real = 0.0;
        output[i].imag = 0.0;
        for(j = 0; j < N; j++){
            a = -pi2*i*j*inv;
            cosA = cos(a);
            sinA = sin(a);
            output[i].real += input[j].real*cosA;
            output[i].imag += input[j].real*sinA;
        }
        //printf("%.6f %.6f\n",output[i].real,output[i].imag);
    }
}

void fft(Complex* X, int N){
    double angle, tmp, wpr, wpi, wr, wi;
    double pi2 = M_PI * 2.0;
    double inv = 1.0/N;
    Complex tc;
    for (int n = 2; n <= N; n <<= 1){
        int n2 = n/2;
        angle = -pi2/n;
        tmp=sin(0.5*angle);
        wpr = -2.0*tmp*tmp;
        wpi = sin(angle);
        wr = 1.0, wi = 0.0;
        for(int m=0; m < n2; ++m){
            for(unsigned int i=m; i < N; i+=n){
                int j = i+n2;
                tc.real = wr*X[j].real - wi*X[j].imag;
                tc.imag = wr*X[j].imag + wi*X[j].real;
                if(j<N) X[j] = X[i] - tc;
                X[i] += tc;
            }
            tmp = wr;
            wr=wr*wpr-wi*wpi+wr;
            wi=wi*wpr+tmp*wpi+wi;
        }
    }
}

void hannWindowing(short* input, short* output, int N){
    for(int i = 0; i < N; i++){
        output[i] = input[i]*0.5*(1-cos(2.0*M_PI*i/(N-1)));
    }
}

void writeCSV(FILE* file, Complex* input, int N){
    fprintf(file,"real,imag\n");
    for(int i = 0; i < N; i++){
        fprintf(file,"%.6f,%.6f\n",input[i].real,input[i].imag);
    }
}

bool checkFFT(Complex* input, Complex* fftout, int N){
    dft(input,outCom2,N);
    for(int i = 0; i < N; i++){
        if(fftout[i].real!=outCom2[i].real||fftout[i].imag!=outCom2[i].imag){
            printf("Error At %d (Real %.3f/%.3f , Imag %.3f/%.3f)\n",i,fftout[i].real,outCom2[i].real,fftout[i].imag,outCom2[i].imag);
            //return false;
        }
    }
    return true;
}


int main()
{
    int readcount;
    SF_INFO info,infoout;
    SNDFILE* inwav = sf_open("274.wav",SFM_READ,&info);
    FILE* csv;
    infoout = info;
    infoout.channels = 1;
    //SNDFILE* outwav = sf_open("out.wav",SFM_WRITE,&infoout);
    if(!inwav){
        std::cout << "Unable to open input file\n";
        sf_perror(NULL);
        return 1;
    }
    /*if(!outwav){
        std::cout << "Unable to open output file\n";
        sf_perror(NULL);
        return 1;
    }*/
    printInfo(info);

    while((readcount = sf_read_short(inwav,data,BUFFER))){
        mergeChannels(data,out,readcount,info.channels);
        //sf_write_short(outwav,out,BUFFER/info.channels);
        //readcount = 5;
        //annWindowing(data,data,readcount);
        for(int i = 0; i < readcount; i++){
            outCom[i].real = inCom[i].real = out[i];
            outCom[i].imag = inCom[i].imag = 0.0;
        }
        dft(inCom,outCom,readcount);
        printf("DFT Finish..\n");
        //checkFFT(inCom,outCom,readcount);
        csv = fopen("dft.csv","w+");
        writeCSV(csv,outCom,readcount);
        fclose(csv);
        break;
    }

    sf_close(inwav);
    //sf_close(outwav);
    return 0;
}
