#include "main.h"

// ===================== Signal Processing =====================
void mergeChannels(short* data, short* out, int datacount, int channels){
    int i,j;
    int sum;
    for(i = 0; i < datacount; i++){
        for(j = 0, sum = 0; j < channels; j++){
            sum += data[i*channels+j];
        }
        out[i] = sum/channels;
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

void normalize(std::array<double, VECSIZE>& a){
    double maxV = 0.0;
    for(unsigned int i = 0; i < a.size(); i++){
        maxV = std::max(maxV, a[i]);
    }
    for(unsigned int i = 0; i < a.size(); i++){
        a[i] = a[i]/maxV;
    }
}

// ===================== Matching Learning =====================

char querry(std::array<double, VECSIZE>& ds, SICONFIG& config){
    std::vector<std::pair<double, char> > closest;
    int co[256] = {};

    for(unsigned int i = 0; i < dlist.size(); i++){
        closest.push_back({doDistance(ds,dlist[i].second,config.distance),dlist[i].first});
    }
    std::sort(closest.begin(),closest.end());
    for(unsigned int i = 0; i < closest.size() && i < config.kcon; i++){
        printf("%c %.4f\n", closest[i].second,closest[i].first);
        co[ (int)closest[i].second ]++;
    }
    printf("\n");
    int mx = 0;
    int mxco = 0;
    char mxty;
    for(int i = 0; i < tysize; i++){
        if(co[ (int)typelist[i] ] > mx){
            mx = co[ (int)typelist[i] ];
            mxco = 1;
            mxty = typelist[i];
        }else if(co[ (int)typelist[i] ] == mx){
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
    unsigned int n = dlist.size();
    file.write((char*)&n,sizeof(unsigned int));
    std::cout << dlist[0].second.size() << "\n";

    for(auto& td : dlist){
        file.put(td.first);
        //std::cout << "SAVE : type = " << td.first << "\n";
        for(double& xi : td.second){
            file.write((char*)&xi,sizeof(double));
        }
    }
    std::cout << "Save Successful\n";
}

void loadTS(std::ifstream& file){
    unsigned int n;
    char ty;
    double xi;
    dlist.clear();
    file.read((char*)&n,sizeof(unsigned int));
    //printf("load...\n");
    for(unsigned int i = 0; i < n; i++){
        file.get(ty);
        dlist.push_back({ty, std::array<double, VECSIZE>() });
        //std::cout << "LOAD " << i << " : type = " << ty << "\n";
        for(int j = 0; j < VECSIZE; j++){
            file.read((char*)&xi,sizeof(double));
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
    printf("Usage : sound-identification [input-sound] [-d dataset] [-t type] [-e file] [-k value][-w windows] [-di distance]\n");
    printf("\t-f dataset\t: Load dataset file as database for KNN Classification\n");
    printf("\t-t type\t\t: Save the result into dataset\n");
    printf("\t-e file\t\t: Export the result as .csv file\n");
    printf("\t-k value\t\t: Set the K value for KNN Classification\n");
    printf("\t-w windows\t: Using the input's windowing function\n");
    printf("\t-d distance\t: Using the input's distance function\n");
}

bool processSound(const char* fileName, double output[], SF_INFO& info, SICONFIG config){
    std::vector<short> input(2*BUFFER);
    std::vector<short> data(BUFFER);
    std::vector<comdouble> inCom(BUFFER),outCom(BUFFER);
    int readcount;
    SNDFILE* inwav = sf_open(fileName,SFM_READ,&info);

    if(!inwav){
        std::cout << "Unable to open input file\n";
        sf_perror(NULL);
        return false;
    }else if(info.frames < BUFFER){
        printf("Error : sound not long enough\n");
        sf_close(inwav);
        return false;
    }
    printInfo(info);

    //skip to the middle of sound
    if(info.seekable) sf_seek(inwav,(info.frames-BUFFER)/2,SEEK_SET);
    else{
        //to seek
        int l = (info.frames-BUFFER)/2;
        for(; l >= BUFFER; l -= BUFFER){
            sf_readf_short(inwav,input.data(),BUFFER);
        }
        if(l) sf_readf_short(inwav,input.data(),l);
    }

    if((readcount = sf_readf_short(inwav,input.data(),BUFFER))==BUFFER){
        mergeChannels(input.data(),data.data(),readcount,info.channels);

        doWindowing(data.data(),data.data(),readcount,config.windows);
        
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
    }else{
        printf("Error : can't read to buffer size (%d/%d)\n",readcount,BUFFER);
        sf_close(inwav);
        return false;
    }

    sf_close(inwav);

    return true;
}

bool processArgs(int argc, char* argv[], SICONFIG& config){
    //process parameter
    printf("GET arg : ");
    for(int i = 0; i < argc; i++){
        printf(" %s :: ", argv[i]);
    }
    printf("\n");

    if(argc<2){
        printInvaild();
        return false;
    }else{
        config.infile = argv[1];

        for(int i = 2; i < argc; i++){
            if(strcmp(argv[i],"-t")==0){
                //train
                if(i+1>=argc){
                    printInvaild();
                    return false;
                }else{
                    config.isTrain = true;
                    config.inputType = argv[++i][0];
                }

            }else if(strcmp(argv[i],"-f")==0){
                //load dataset
                if(i+1>=argc){
                    printInvaild();
                    return false;
                }else{
                    config.tsfile = argv[++i];
                }
            }else if(strcmp(argv[i],"-e")==0){
                //export as csv
                if(i+1>=argc){
                    printInvaild();
                    return false;
                }else{
                    config.outfile = argv[++i];
                }
            }else if(strcmp(argv[i],"-k")==0){
                //k value
                if(i+1>=argc){
                    printInvaild();
                    return false;
                }else{
                    config.kcon = atoi(argv[++i]);
                }
            }else if(strcmp(argv[i],"-w")==0){
                //use input's windowing
                if(i+1>=argc){
                    printInvaild();
                    return false;
                }else{
                    config.windows = argv[++i][0];
                }
            }else if(strcmp(argv[i],"-d")==0){
                //distance
                if(i+1>=argc){
                    printInvaild();
                    return false;
                }else{
                    config.distance = argv[++i][0];
                }
            }
        }
    }
    return true;
}

int main(int argc, char* argv[])
{
    std::vector <double> outvec(BUFFER);
    SICONFIG config;

    if(!processArgs(argc, argv, config)){
        return 1;
    } 

    SF_INFO info;
    if(!processSound(config.infile.c_str(),outvec.data(),info,config)){
        return 2;
    }

    //convert outvec to machvec
    std::array<double, VECSIZE> machvec;
    for(int i = 0; i < VECSIZE; i++){
        machvec[i] = outvec[i];
    }

    //open testdata
    if(config.tsfile!=""){
        std::ifstream fileTS;
        fileTS.open(config.tsfile, std::ifstream::in | std::ifstream::binary);
        if(fileTS.is_open()) loadTS(fileTS);
        else printf("Error open Testdata file\n");
        fileTS.close();
    }

    if(config.isTrain){
        train({config.inputType,machvec});

        std::ofstream outTS;
        outTS.open(config.tsfile, std::ofstream::out | std::ofstream::binary);
        if(outTS.is_open()) saveTS(outTS);
        else printf("Error save testdata file\n");
        outTS.close();

    }else{
        //predict type
        config.inputType = querry(machvec,config);
    }

    if(config.outfile!=""){
        //scale to Hz
        double scale = info.samplerate/(double)info.frames;

        //write csv
        FILE* csv;
        csv = fopen(config.outfile.c_str(),"w+");
        writeCSV(csv,outvec.data(),info.frames,scale,config.inputType);
        fclose(csv);
    }

    printf("%c",config.inputType);
    return 0;
}
