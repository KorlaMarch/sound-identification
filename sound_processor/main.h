#ifndef MAIN_H

#define MAIN_H

#include "iostream"
#include "fstream"
#include "include/sndfile.h"
#include "conio.h"
#include "math.h"
#include "stdio.h"
#include "stdlib.h"
#include "complex"
#include "vector"
#include "array"
#include "algorithm"
#include "string.h"
#include "string"
#include "constant.h"
#include "windowing.h"
#include "distance.h"
#include "siconfig.h"

typedef std::complex<double> comdouble;

// Signal Processing
void mergeChannels(short* data, short* out, int datacount, int channels);
void fft(comdouble* in, comdouble* out, int N, int s);

// Matching Learning - KNN
const int tysize = 3;
const char typelist[3] = {'P','G','V'};
std::vector<std::pair<char, std::array<double, VECSIZE> > > dlist;
double distance(std::array<double, VECSIZE>& a, std::array<double, VECSIZE>& b);
char querry(std::array<double, VECSIZE>& ds, SICONFIG& config);
void train(std::pair<char, std::array<double, VECSIZE> > ds);

// Input and Output
void printInfo(SF_INFO info);
void saveTS(FILE* file);
void loadTS(FILE* file);
void writeCSV(FILE* file, comdouble* input, int N, double scaleX);

bool processSound(const char* fileName, double output[], SF_INFO& info, SICONFIG config);
void printInvaild();
bool processArgs(int argc, char* argv[], SICONFIG& config);

int main(int argc, char* argv[]);

#endif
