#include "main.h"
#include "array"

// ===================== Signal Processing =====================
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

// ===================== Matching Learning =====================

double distance(std::array<double, VECSIZE>& a, std::array<double, VECSIZE>& b){
    double sum = 0;
    for(int i = 0; i < VECSIZE; i++){
        sum += (a[i]-b[i])*(a[i]-b[i]);
    }
    return sqrt(sum);
}

char querry(std::array<double, VECSIZE>& ds){
    std::vector<std::pair<char, int> > closest;
    int co[256] = {};

    for(unsigned int i = 0; i < dlist.size(); i++){
        closest.push_back({distance(ds,dlist[i].second),dlist[i].first});
    }
    std::sort(closest.begin(),closest.end());
    for(unsigned int i = 0; i < closest.size() && i < kcon; i++){
        co[closest[i].second]++;
    }
    int mx = 0;
    int mxco = 0;
    char mxty;
    for(int i = 0; i < tysize; i++){
        if(co[ typelist[i] ] > mx){
            mx = co[ typelist[i] ];
            mxco = 1;
            mxty = typelist[i];
        }else if(co[ typelist[i] ] == mx){
            mxco++;
        }
    }
    return mxco==1 ? mxty : 'E';
}

void train(std::pair<char, std::array<double, VECSIZE> > ds){
    dlist.push_back(ds);
}

// ===================== Input and Output =====================

void printInfo(SF_INFO info){
    printf("Frames : %I64d\n",info.frames);
    printf("Samplerate : %d\n",info.samplerate);
    printf("Channels : %d\n",info.channels);
    //printf("Format : %#08x\n",info.format);
    //printf("Sections : %d\n",info.sections);
    printf("Seekable : %d\n",info.seekable);
}

void saveTS(std::ofstream& file){
    file << dlist.size();
    for(auto& td : dlist){
        file << td.first;
        for(auto& xi : td.second){
            file << xi;
        }
    }
    std::cout << "Save Successful";
}

void loadTS(std::ifstream& file){
    int n;
    char ty;
    double xi;
    dlist.clear();
    file >> n;
    for(int i = 0; i < n; i++){
        file >> ty;
        dlist.push_back({ty, std::array<double, VECSIZE>() });
        //std::cout << "LOAD " << i << " : type = " << ty << "\n";
        for(int j = 0; j < VECSIZE; j++){
            file >> xi;
            dlist.back().second[j] = xi;
        }
    }
}

void writeCSV(FILE* file, double* input, int N, double scaleX, char type){
    fprintf(file,"%c\n",type);
    fprintf(file,"%.4f\n",scaleX);
    fprintf(file,"%d\n",N);
    for(int i = 0; i < N; i++){
        fprintf(file,"%.4f\n",input[i]);
    }
}

void printInvaild(){
    printf("Invaild argument\n");
    printf("Usage : \n");
}

SF_INFO processSound(char fileName[], double output[]){
    std::vector<short> input(2*BUFFER);
    std::vector<short> data(BUFFER);
    std::vector<comdouble> inCom(BUFFER),outCom(BUFFER);
    int readcount;
    SF_INFO info;
    SNDFILE* inwav = sf_open(fileName,SFM_READ,&info);

    if(!inwav){
        std::cout << "Unable to open input file\n";
        sf_perror(NULL);
        return info;
    }else if(info.frames < BUFFER){
        printf("Error : sound not long enough");
    }
    printInfo(info);

    //skip to the middle of sound
    sf_seek(inwav,(info.frames-BUFFER)/2+500000,SEEK_SET);

    if((readcount = sf_readf_short(inwav,input.data(),BUFFER))){
        mergeChannels(input.data(),data.data(),readcount,info.channels);
        if(isHann) hannWindowing(data.data(),data.data(),readcount);
        for(int i = 0; i < readcount; i++){
            outCom[i] = comdouble( 0.0, 0.0 );
            inCom[i] = comdouble( data[i], 0.0 );
        }
        fft(inCom.data(),outCom.data(),readcount,1);
        //do inverse
        const double inv = 1.0/readcount;
        for(int i = 0; i < readcount; i++){
            outCom[i] *= inv;
        }
        printf("FFT Finish.. (readcount = %d)\n",readcount);
        for(int i = 0; i < readcount; i++){
            output[i] = std::abs(outCom[i]);
        }
        info.frames = readcount;
    }

    sf_close(inwav);

    return info;
}

int main(int argc, char* argv[])
{
    bool isAdd = false;
    char inputType = '\0';
    std::vector <double> outvec(BUFFER);
    printf("GET arg : ");
    for(int i = 0; i < argc; i++){
        printf(" %s ::: ", argv[i]);
    }
    printf("\n");

    if(argc<3){
        printInvaild();
        return -1;
    }else{
        for(int i = 3; i < argc; i++){
            if(strcmp(argv[i],"-a")==0){
                if(i+1>=argc){
                    printInvaild();
                    return -1;
                }else{
                    isAdd = true;
                    printf("mi %s\n", argv[i+1]);
                    inputType = argv[i+1][0];
                    i++;
                }
            }else if(strcmp(argv[i],"-ld")==0){
                //load testset
                std::ifstream fileTS;
                fileTS.open("ts.bin");
                if(fileTS.is_open()) loadTS(fileTS);
                else printf("Error open Testdata file\n");
                fileTS.close();
            }
        }
    }

    SF_INFO info = processSound(argv[1],outvec.data());

    //convert outvec to machvec
    std::array<double, VECSIZE> machvec;
    for(int i = 0; i < VECSIZE; i++){
        machvec[i] = outvec[i];
    }

    if(isAdd){
        train({inputType,machvec});

        std::ofstream outTS;
        outTS.open("ts.bin");
        if(outTS.is_open()) saveTS(outTS);
        else printf("Error save testdata file\n");
        outTS.close();
        
    }else{
        //predict type
        inputType = querry(machvec);
    }

    //scale to Hz
    double scale = info.samplerate/(double)info.frames;

    //write csv
    FILE* csv;
    csv = fopen(argv[2],"w+");
    writeCSV(csv,outvec.data(),info.frames,scale,inputType);
    fclose(csv);

    return 0;
}
