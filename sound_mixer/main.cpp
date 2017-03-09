#include "main.h"

// ===================== Input and Output =====================

void printInfo(SF_INFO info){
    printf("Frames : %I64d\n",info.frames);
    printf("Samplerate : %d\n",info.samplerate);
    printf("Channels : %d\n",info.channels);
    //printf("Format : %#08x\n",info.format);
    //printf("Sections : %d\n",info.sections);
    printf("Seekable : %d\n",info.seekable);
}

void printInvaild(){
    printf("Invaild argument\n");
    printf("Usage : sound-mixer [first-sound] [second-sound] [output-sound] [-p factor]\n");
    printf("\t-p factor\t: factor is a number between 0.0-1.0 specific the fector that will multiply to a and b\n");
    printf("\t\ta will multiply by factor and b will multiply by 1-factor (default is 0.5)\n");
}

void seek(SNDFILE* file, SF_INFO info, int n){
    if(info.seekable) sf_seek(file,n,SEEK_SET);
    else{
        std::vector<double> buffer(BUFFER);
        //to seek
        for(; n >= BUFFER; n -= BUFFER){
            sf_readf_double(file,buffer.data(),BUFFER);
        }
        if(n) sf_readf_double(file,buffer.data(),n);
    }
}

bool processSound(const char* fileA, const char* fileB, const char* outfile){
    SF_INFO infoA,infoB,infoO;
    SNDFILE* ina = sf_open(fileA,SFM_READ,&infoA);
    SNDFILE* inb = sf_open(fileB,SFM_READ,&infoB);
    infoO = infoA;
    SNDFILE* out = sf_open(outfile,SFM_WRITE,&infoO);

    if(!ina||!inb||!out){
        std::cout << "Unable to open input file\n";
        sf_perror(NULL);
        return false;
    }
    if(infoA.channels!=1||infoB.channels!=1){
        std::cout << "Cannon process multi-channels sound\n";
    }
    printf("INFO A:\n");
    printInfo(infoA);
    printf("INFO B:\n");
    printInfo(infoB);

    double maxA,maxB;
    sf_command (ina, SFC_SET_NORM_DOUBLE, NULL, SF_TRUE) ;
    sf_command (inb, SFC_SET_NORM_DOUBLE, NULL, SF_TRUE) ;
    sf_command (out, SFC_SET_NORM_DOUBLE, NULL, SF_TRUE) ;
    sf_command (ina, SFC_CALC_NORM_SIGNAL_MAX, &maxA, sizeof (maxA)) ;
    sf_command (inb, SFC_CALC_NORM_SIGNAL_MAX, &maxB, sizeof (maxB)) ;

    int minframe;
    if(infoA.frames<infoB.frames){
        minframe = infoA.frames;
        //random seek B
        int seekNum = rand()%(infoB.frames-infoA.frames+1);
        seek(inb,infoB,seekNum);
    }else{
        minframe = infoB.frames;
        //random seek A
        int seekNum = rand()%(infoA.frames-infoB.frames+1);
        seek(ina,infoA,seekNum);
    }

    std::vector<double> soundA(BUFFER);
    std::vector<double> soundB(BUFFER);
    std::vector<double> soundO(BUFFER);
    for(int i = 0; i < minframe; i++){
        int countA = sf_read_double(ina,soundA.data(),BUFFER);
        int countB = sf_read_double(inb,soundB.data(),BUFFER);
        int limit = std::min(countA,countB);
        for(int j = 0; j < limit; j++){
            soundO[j] = soundA[j]/maxA*factor + soundB[j]/maxB*(1.0-factor);
            //printf("sound O : %.3f %.3f %.3f %.3f\n",soundA[j],maxA,soundB[j],maxB);
        }
        sf_write_double(out,soundO.data(),limit);
    }

    sf_close(ina);
    sf_close(inb);
    sf_close(out);
    printf("End of mixing sound\n");
    return true;
}

bool processArgs(int argc, char* argv[]){
    //process parameter
    printf("GET arg : ");
    for(int i = 0; i < argc; i++){
        printf(" %s :: ", argv[i]);
    }
    printf("\n");

    if(argc<4||argc>6){
        printInvaild();
        return false;
    }else{
        afile = std::string(argv[1]);
        bfile = std::string(argv[2]);
        outfile = std::string(argv[3]);
        factor = 0.5;

        if(strcmp(argv[4],"-p")==0){
            if(5>=argc){
                printInvaild();
                return false;
            }else{
                if(!sscanf(argv[5]," %lf", &factor)){
                    printInvaild();
                    return false;
                }
            }
        }else{
            printInvaild();
            return false;
        }
    }
    return true;
}

int main(int argc, char* argv[])
{
    //set random seed
    srand(time(NULL));

    if(!processArgs(argc, argv)){
        return 1;
    } 

    if(!processSound(afile.c_str(),bfile.c_str(),outfile.c_str())){
        return 2;
    }

    return 0;
}
