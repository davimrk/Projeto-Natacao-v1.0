for linha in range(6):
    for coluna in range(7):
        if (linha == 0 and coluna % 3 != 0) or (linha == 1 and coluna % 3 == 0) or (linha - coluna == 2) or (linha + coluna == 8):
            print("*", end=" ")
        else:
            print(" ", end=" ")
    print()