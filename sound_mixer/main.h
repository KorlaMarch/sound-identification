#ifndef MAIN_H

#define MAIN_H

#include "stdio.h"
#include "include/sndfile.h"
#include "string"
#include "algorithm"
#include "time.h"
#include "stdlib.h"
#include "iostream"
#include "string.h"

#define BUFFER (1<<15)

std::string afile;
std::string bfile;
std::string outfile;
double factor;

bool processSound(const char* fileA, const char* fileB, const char* outfile);
bool processArgs(int argc, char* argv[]);
void printInvaild();

int main(int argc, char* argv[]);

#endif
